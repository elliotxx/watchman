package main

import (
	"flag"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/robfig/cron/v3"
	"os"
	"time"
	"watchman-api/api"
)

func syncJobsFromDB() error {
	// 同步数据库中存在的定时任务
	jobs := []api.Job{}
	// 取出数据库中存储的所有定时任务
	err := api.DB.Find(&jobs).Error
	if err != nil {
		return err
	}
	// 遍历每个定时任务
	for _, job := range jobs {
		glog.Info(job)
		if job.Status != 0 || job.DeletedAt != nil {
			continue
		}
		// 在 Cron 调度器中创建新任务
		jobFunc := api.JobFunc{Job: job}
		entryID, err := api.Cron.AddJob(job.Cron, jobFunc)
		if err != nil {
			return err
		}
		// 更新数据库中的 EntryID 字段
		err = api.DB.Model(&job).Update("EntryID", entryID).Error
		if err != nil {
			return err
		}
	}

	// 输出调度器中的所有定时任务
	api.PrintAllJobsEntryID()
	return nil
}

func main() {
	// 初始化阶段
	// 初始化日志库
	flag.Parse()
	// Flush守护进程会间隔30s周期性地flush缓冲区中的log
	defer glog.Flush()

	// 连接 sqlite3 数据库
	var err error
	api.DB, err = gorm.Open("sqlite3", "watchman.db")
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}
	defer api.DB.Close()
	// 自动迁移模式将保持更新到最新
	// 自动迁移仅仅会创建表，缺少列和索引，并且不会改变现有列的类型或删除未使用的列以保护数据
	api.DB.AutoMigrate(&api.Job{}, &api.Account{}, &api.Template{})

	// 创建&开始 cron 实例
	api.Cron = cron.New()
	// 同步数据库中存在的定时任务
	err = syncJobsFromDB()
	if err != nil {
		glog.Error(err.Error())
	}
	api.Cron.Start()

	// 创建 gin 实例
	r := gin.Default()

	// 添加 cros 中间件，允许跨域访问
	r.Use(cors.New(cors.Config{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 添加接口组路由及响应函数
	// 同时声明该组路由都需要验证
	v1 := r.Group("/api/v1", gin.BasicAuth(gin.Accounts(api.Secrets)))
	{
		// 测试当前是否认证通过
		v1.GET("/secrets", api.SecretsHandler)

		// 定时任务 CRUD 接口
		v1.POST("/job", api.AddJob)
		v1.DELETE("/job", api.DeleteJob)
		v1.PUT("/job", api.UpdateJob)
		v1.GET("/job", api.ListJob)

		// 通知账户 CRUD 接口
		v1.POST("/account", api.AddAccount)
		v1.DELETE("/account", api.DeleteAccount)
		v1.PUT("/account", api.UpdateAccount)
		v1.GET("/account", api.ListAccount)

		// 测试功能接口
		v1.GET("/testpattern", api.TestPattern)
		v1.POST("/testemail", api.TestEmail)

		// 任务模板 CRUD 接口
		v1.POST("/template", api.AddTemplate)
		v1.DELETE("/template", api.DeleteTemplate)
		v1.PUT("/template", api.UpdateTemplate)
		v1.GET("/template", api.ListTemplate)
	}

	// 让服务跑起来，默认监听 0.0.0.0:8080，也可以通过环境变量 GIN_PORT 指定
	port := os.Getenv("GIN_PORT")
	if port == "" {
		r.Run()
	} else {
		r.Run(":" + port)
	}
}
