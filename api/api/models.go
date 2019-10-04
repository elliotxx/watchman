package api

import "github.com/jinzhu/gorm"

var DB *gorm.DB

type Job struct {
	gorm.Model
	Name    string `json:"name" gorm:"not null;unique"`       // 任务名称，设置字段为非空并唯一
	Cron    string `json:"cron"`                              // 定时配置
	Url     string `json:"url" gorm:"type:varchar(1000)"`     // 目标页面 URL
	Pattern string `json:"pattern" gorm:"type:varchar(1000)"` // 抓取规则
	Charset string `json:"charset" gorm:"type:varchar(100)"`  // 目标页面编码
	Content string `json:"content" gorm:"type:varchar(2000)"` // 邮件内容
	Status  int    `json:"status"`                            // 运行状态, 0代表“运行中”、1代表“暂停”
}
