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
	var oldValue, newValue string
	infoPrefix := "[Job#%d][%s] "
	// 爬取目标页面 html
	glog.Infof("[Job#%d][%s][%s][Status:%d][EntryID:%d][%s] Start.", job.ID, job.Name, job.Cron, job.Status, job.EntryID, job.OldValue)
	glog.Infof(infoPrefix+"Crawling target page...", job.ID, job.Name)
	// 生成client客户端
	client := &http.Client{}
	// 生成Request对象
	req, err := http.NewRequest("GET", job.Url, nil)
	if err != nil {
		return err
	}
	// 添加Header
	req.Header.Add("User-Agent", UserAgent)
	// 发起请求
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	// 最后关闭响应体
	defer resp.Body.Close()
	// 读取响应体
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	html := string(body)

	// 匹配指定内容（获取新值）
	glog.Infof(infoPrefix+"Matching target item...", job.ID, job.Name)
	r, _ := regexp.Compile(job.Pattern)
	result := r.FindStringSubmatch(html)
	if len(result) >= 2 {
		newValue = result[1]
		glog.Infof(infoPrefix+"Match to target: %s", job.ID, job.Name, newValue)
	} else {
		glog.Infof(infoPrefix+"Don`t match target", job.ID, job.Name)
		return fmt.Errorf("Don`t match target")
	}

	// 从数据库中取出当前旧值
	tmpJob := Job{}
	err = DB.First(&tmpJob, job.ID).Error
	if err != nil {
		return err
	}
	oldValue = tmpJob.OldValue

	// 判断指定内容和数据库中是否一样
	glog.Infof(infoPrefix+"Checking new value '%s' vs. old value '%s'...", job.ID, job.Name, newValue, oldValue)
	if newValue == oldValue {
		glog.Infof(infoPrefix+"New value == old value, skipping", job.ID, job.Name)
	} else {
		glog.Infof(infoPrefix+"New value != old value, updating old value and sending notification...", job.ID, job.Name)
		// 更新旧值
		err = DB.Model(&job).Update("old_value", newValue).Error
		if err != nil {
			return err
		}
		// 发送通知
	}
	glog.Infof("[Job#%d][%s][%s][Status:%d][EntryID:%d][%s] End.", job.ID, job.Name, job.Cron, job.Status, job.EntryID, job.OldValue)
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
