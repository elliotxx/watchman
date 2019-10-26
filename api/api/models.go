package api

import (
	"github.com/golang/glog"
	"github.com/jinzhu/gorm"
)

// 各类结构体定义

// 数据库 Model
type Job struct {
	gorm.Model
	Name          string `json:"name" gorm:"not null;unique"`        // 任务名称，设置字段为非空并唯一
	Cron          string `json:"cron"`                               // 定时配置
	Url           string `json:"url" gorm:"type:varchar(1000)"`      // 目标页面 URL
	Pattern       string `json:"pattern" gorm:"type:varchar(2000)"`  // 抓取规则
	PatternStatus int    `json:"patternStatus"`                      // 抓取规则的测试状态，0 代表未测试，是默认值；1 代表测试有效；2 代表测试无效；3 代表测试中；
	Email         string `json:"email" gorm:"not null"`              // 通知账户
	Content       string `json:"content" gorm:"type:varchar(2000)"`  // 邮件内容
	Status        int    `json:"status"`                             // 运行状态, 0代表“运行中”、1代表“暂停”
	EntryID       int    `json:"entryId" gorm:"not null"`            // cron 调度器的 job id
	OldValue      string `json:"oldValue" gorm:"type:varchar(1000)"` // 该任务抓取目标的旧值
}

type Account struct {
	gorm.Model
	Email    string `json:"email" gorm:"not null;unique"`  // 邮箱
	Password string `json:"password" gorm:"not null"`      // 邮箱密码 / 授权码
	Host     string `json:"host" gorm:"type:varchar(200)"` // 邮箱 SMTP 主机
	Port     int    `json:"port"`                          // 邮箱 SMTP 端口号
	Status   int    `json:"status"`                        // Email 账户的连通性，是否可以用来发邮件；0 代表未测试，是默认值；1 代表测试有效；2 代表测试无效；3 代表测试中；
}

type Template struct {
	gorm.Model
	Name    string `json:"name" gorm:"not null;unique"`       // 模板名称，设置字段为非空并唯一
	Cron    string `json:"cron"`                              // 定时配置
	Pattern string `json:"pattern" gorm:"type:varchar(2000)"` // 抓取规则
	Content string `json:"content" gorm:"type:varchar(2000)"` // 邮件内容
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

// 邮箱后缀对应的 host 和 port 映射表
var Suffix2host = map[string]string{
	"qq.com":       "smtp.qq.com",
	"163.com":      "smtp.163.com",
	"126.com":      "smtp.126.com",
	"139.com":      "smtp.139.com",
	"gmail.com":    "smtp.gmail.com",
	"foxmail.com":  "smtp.foxmail.com",
	"sina.com.cn":  "smtp.sina.com.cn",
	"sohu.com":     "smtp.sohu.com",
	"yahoo.com.cn": "smtp.mail.yahoo.com.cn",
	"live.com":     "smtp.live.com",
	"263.net":      "smtp.263.net",
	"263.net.cn":   "smtp.263.net.cn",
	"x263.net":     "smtp.263.net",
	"china.com":    "smtp.china.com",
	"tom.com":      "smtp.tom.com",
}
var Suffix2port = map[string]int{
	"qq.com":       465,
	"163.com":      465,
	"126.com":      465,
	"139.com":      465,
	"gmail.com":    587,
	"foxmail.com":  465,
	"sina.com.cn":  25,
	"sohu.com":     25,
	"yahoo.com.cn": 587,
	"live.com":     587,
	"263.net":      25,
	"263.net.cn":   25,
	"x263.net":     25,
	"china.com":    25,
	"tom.com":      25,
}
