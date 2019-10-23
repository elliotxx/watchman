package api

import (
	"bufio"
	"crypto/tls"
	"fmt"
	"github.com/golang/glog"
	"golang.org/x/net/html/charset"
	"golang.org/x/text/transform"
	"gopkg.in/gomail.v2"
	"io"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// 定时任务通用 Job
func WatchJob(job Job) error {
	// 功能：爬取目标页面指定内容，和数据库中对比，如果不一样，就发送邮件通知，如果一样，就什么也不做
	// 定时任务结束时，输出缓冲区的日志
	defer glog.Flush()

	var oldValue, newValue string
	var infoPrefix = "[Job#%d][%s] "

	// 爬取目标页面 html
	glog.Infof(infoPrefix+"Crawling target page...", job.ID, job.Name)
	html, err := GetHtmlByUrl(job.Url)
	if err != nil {
		return err
	}

	// 匹配指定内容（获取新值）
	glog.Infof(infoPrefix+"Matching target item...", job.ID, job.Name)
	// 根据正则表达式 pattern 找到 html 中的对应内容
	newValue, err = MatchTargetByRE(html, job.Pattern)
	if err != nil {
		return err
	}
	glog.Infof(infoPrefix+"Match to target as new value: '%s'", job.ID, job.Name, newValue)

	// 从数据库中取出当前旧值
	glog.Infof(infoPrefix+"Getting old value from Database...", job.ID, job.Name)
	tmpJob := Job{}
	err = DB.First(&tmpJob, job.ID).Error
	if err != nil {
		return err
	}
	oldValue = tmpJob.OldValue
	glog.Infof(infoPrefix+"Get the old value: '%s'", job.ID, job.Name, oldValue)

	// 判断旧值和新值是否一样
	glog.Infof(infoPrefix+"Checking new value '%s' vs. old value '%s'...", job.ID, job.Name, newValue, oldValue)
	if newValue == oldValue {
		// 相同，跳过
		glog.Infof(infoPrefix+"New value == old value, skipping", job.ID, job.Name)
	} else {
		// 不相同，更新数据库 & 发送通知
		glog.Infof(infoPrefix+"New value != old value, updating old value and sending notification...", job.ID, job.Name)

		// 更新旧值
		err = DB.Model(&job).Update("old_value", newValue).Error
		if err != nil {
			return err
		}

		// 从数据库中取出发送方 Email 账户，用于发送通知
		var account Account
		err = DB.Where("email = ?", job.Email).First(&account).Error
		if err != nil {
			return err
		}

		// 替换 job.Content 内容中的变量，比如 %target%, %name%，分别代表匹配到的目标和定时任务标题
		re, _ := regexp.Compile("%target%")
		job.Content = re.ReplaceAllString(job.Content, newValue)
		re, _ = regexp.Compile("%name%")
		job.Content = re.ReplaceAllString(job.Content, job.Name)

		// 发送通知
		err = SendMail(account, []string{job.Email}, fmt.Sprintf(EmailSubject, job.Name), job.Content)
		if err != nil {
			return err
		}
	}
	return nil
}

func GetHtmlByUrl(url string) ([]byte, error) {
	// 抓取指定 url 的 html 页面源码，可自动适配页面编码
	// 生成client客户端
	client := &http.Client{
		Timeout: time.Duration(Timeout) * time.Second,
		Transport: &http.Transport{ // 解决x509: certificate signed by unknown authority
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // client 将不再对服务端的证书进行校验
		},
	}
	// 生成Request对象
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return []byte{}, err
	}
	// 添加Header
	req.Header.Add("User-Agent", UserAgent)
	// 发起请求
	resp, err := client.Do(req)
	if err != nil {
		return []byte{}, err
	}
	// 最后关闭响应体
	defer resp.Body.Close()

	// 读取响应体，自动适配编码
	html, err := DetermineEncoding(resp.Body)
	if err != nil {
		return []byte{}, err
	}
	return html, nil
}

func MatchTargetByRE(content []byte, pattern string) (string, error) {
	// 根据正则表达式 pattern，匹配 content 中的目标内容
	r, _ := regexp.Compile(pattern)
	// 在 content 中查找 re 中编译好的正则表达式，并返回第一个匹配的内容
	items := r.FindSubmatch(content)
	if len(items) >= 2 {
		result := string(items[1])
		return result, nil
	} else {
		return "", fmt.Errorf("Don`t match target")
	}
}

func DetermineEncoding(r io.Reader) ([]byte, error) {
	// 自动转换页面编码，由 html 页面决定编码
	// ref: https://studygolang.com/articles/13863
	OldReader := bufio.NewReader(r)
	bytes, err := OldReader.Peek(1024)
	if err != nil {
		return []byte{}, err
	}
	e, _, _ := charset.DetermineEncoding(bytes, "")
	reader := transform.NewReader(OldReader, e.NewDecoder())

	// 读取响应体
	html, err := ioutil.ReadAll(reader)
	if err != nil {
		return []byte{}, err
	}
	return html, nil
}

func SendMail(account Account, mailTo []string, subject string, body string) error {
	// 解析发送邮箱的主机和端口号
	host, port, err := ParseEmailHostport(account.Email)
	if err != nil {
		return err
	}

	// 邮件信息，发送方、接收方、邮件主题、邮件正文等
	m := gomail.NewMessage()
	m.SetHeader("From", account.Email)
	m.SetHeader("To", mailTo...)    // 可以发送给多个用户
	m.SetHeader("Subject", subject) // 设置邮件主题
	m.SetBody("text/html", body)    // 设置邮件正文

	// 发送邮件
	d := gomail.NewDialer(host, port, account.Email, account.Password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	err = d.DialAndSend(m)

	return err
}

func ParseEmailHostport(email string) (string, int, error) {
	// 邮箱后缀对应的 host 和 port 映射表
	suffix2host := map[string]string{
		"qq.com": "smtp.qq.com",
	}
	suffix2port := map[string]int{
		"qq.com": 465,
	}

	// 获取 email 后缀，比如 xxx@qq.com，后缀为 qq.com
	result := strings.Split(email, "@")
	if len(result) <= 1 {
		return "", 0, fmt.Errorf("Error parsing email to suffix")
	}
	suffix := result[len(result)-1]

	// 根据 email 后缀获取 host 和 port
	host, ok1 := suffix2host[suffix]
	port, ok2 := suffix2port[suffix]
	if ok1 && ok2 {
		return host, port, nil
	} else {
		return host, port, fmt.Errorf("No corresponding host and port found")
	}
}

func IsConnectedEmail(account Account) error {
	// 测试该 Email 账户是否连通
	// 解析 Email 的主机和端口号
	host, port, err := ParseEmailHostport(account.Email)
	if err != nil {
		return err
	}
	// 拨号并向 SMTP 服务器进行身份验证
	d := gomail.NewDialer(host, port, account.Email, account.Password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	_, err = d.Dial()
	if err != nil {
		return err
	}
	return nil
}

// 根据任务名称判断某个定时任务在数据库中是否存在
func isJobExistByName(name string) bool {
	var job Job
	DB.Find(&job, "name = ?", name)
	if job == (Job{}) {
		return false
	} else {
		return true
	}
}

// 根据任务ID判断某个定时任务在数据库中是否存在
func isJobExistByID(id uint) bool {
	var job Job
	DB.Find(&job, "id = ?", id)
	if job == (Job{}) {
		return false
	} else {
		return true
	}
}

// 根据 ID 获取指定 Job 在数据库中的 EntryID
func getJobEntryIDByID(id uint) (int, error) {
	var err error
	job := Job{}
	err = DB.First(&job, id).Error
	if err != nil {
		return 0, err
	}
	return job.EntryID, nil
}

// 输出调度器中的所有定时任务
func PrintAllJobsEntryID() {
	var result string
	for _, c := range Cron.Entries() {
		result += fmt.Sprintf("%d %s", c.ID, c.Next.String())
	}
	glog.Infof("Current all jobs: %s", result)
}

// 根据邮箱账户判断某个通知账户在数据库中是否存在
//func isAccountExistByEmail(email string) bool {
//	var account Account
//	DB.Find(&account, "email = ?", email)
//	if account == (Account{}) {
//		return false
//	} else {
//		return true
//	}
//}
