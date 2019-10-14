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
