package api

import (
	"github.com/golang/glog"
	"github.com/jinzhu/gorm"
)

// 各类结构体定义

// 数据库 Model
type Job struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null;unique"`        // 任务名称，设置字段为非空并唯一
	Cron     string `json:"cron"`                               // 定时配置
	Url      string `json:"url" gorm:"type:varchar(1000)"`      // 目标页面 URL
	Pattern  string `json:"pattern" gorm:"type:varchar(2000)"`  // 抓取规则
	Email    string `json:"email" gorm:"not null"`              // 通知账户
	Content  string `json:"content" gorm:"type:varchar(2000)"`  // 邮件内容
	Status   int    `json:"status"`                             // 运行状态, 0代表“运行中”、1代表“暂停”
	EntryID  int    `json:"entryId" gorm:"not null"`            // cron 调度器的 job id
	OldValue string `json:"oldValue" gorm:"type:varchar(1000)"` // 该任务抓取目标的旧值
}

type Account struct {
	gorm.Model
	Email    string `json:"email" gorm:"not null;unique"` // 邮箱
	Password string `json:"password" gorm:"not null"`     // 邮箱密码 / 授权码
}

// JobFunc 定义
type JobFunc struct {
	Job Job // 包含定时任务运行的必要信息，比如抓取目标 URL，匹配规则等
}

func (j JobFunc) Run() {
	// 定时任务通过 Run() 来执行
	infoPrefix := "[Job#%d][%s] "

	// 任务执行前后的提示信息
	glog.Infof("[Job#%d][%s][%s][Status:%d][EntryID:%d][%s] Start.", j.Job.ID, j.Job.Name, j.Job.Cron, j.Job.Status, j.Job.EntryID, j.Job.OldValue)
	defer glog.Infof("[Job#%d][%s][%s][Status:%d][EntryID:%d][%s] End.", j.Job.ID, j.Job.Name, j.Job.Cron, j.Job.Status, j.Job.EntryID, j.Job.OldValue)

	// 执行定时任务
	err := WatchJob(j.Job)
	if err != nil {
		glog.Errorf(infoPrefix+err.Error(), j.Job.ID, j.Job.Name)
	}
}
