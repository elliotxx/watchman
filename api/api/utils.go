package api

import (
	"fmt"
	"github.com/golang/glog"
)

// 定时任务通用 Job
func WatchJob(job Job) {
	// 功能：爬取目标页面指定内容，和数据库中对比，如果不一样，就发送邮件通知，如果一样，就什么也不做
	// 爬取目标页面指定内容
	// 判断指定内容和数据库中是否一样
	glog.Info("job name: ", job.Name)
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
