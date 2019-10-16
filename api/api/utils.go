package api

import (
	"fmt"
	"github.com/golang/glog"
	"io/ioutil"
	"net/http"
	"regexp"
)

// 定时任务通用 Job
func WatchJob(job Job) error {
	// 功能：爬取目标页面指定内容，和数据库中对比，如果不一样，就发送邮件通知，如果一样，就什么也不做
	// 爬取目标页面 html
	// 生成client客户端
	client := &http.Client{}
	// 生成Request对象
	req, err := http.NewRequest("GET", job.Url, nil)
	if err != nil {
		return err
	}
	// 添加Header
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6")
	// 发起请求
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	// 设定关闭响应体
	defer resp.Body.Close()
	// 读取响应体
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	html := string(body)
	fmt.Println(html)

	// 匹配指定内容
	r, _ := regexp.Compile(`<a class="blue" href=".*?" data-eid="qd_G19" data-cid=".*?" title=".*?" target="_blank">(.*?)</a><i>.*?</i><em class="time">.*?</em>`)
	result := r.FindStringSubmatch(html)
	if len(result) >= 2 {
		fmt.Println(result[1])
	} else {
		return fmt.Errorf("Don`t found target")
	}

	// 判断指定内容和数据库中是否一样
	glog.Info("job name: ", job.Name)
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
func printAllJobsEntryID() {
	var result string
	for _, c := range Cron.Entries() {
		result += fmt.Sprintf("%d ", c.ID)
	}
	glog.Infof("Current all jobs: %s", result)
}
