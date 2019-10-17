package api

import (
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
)

// 全局变量
// 数据库实例
var DB *gorm.DB

// cron 调度器实例
var Cron *cron.Cron

// 爬虫配置
var UserAgent = "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6"
