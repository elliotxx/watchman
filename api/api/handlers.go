package api

import (
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
	"net/http"
	"strconv"
	"time"
)

// 接口：添加定时任务
func AddJob(c *gin.Context) {
	// 从 post form 中提取参数
	var job Job
	if c.BindJSON(&job) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}
	// 判断是否已经存在
	if isJobExistByName(job.Name) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "该任务名称已经存在",
		})
		return
	}

	// 写入数据库
	err := DB.Create(&job).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务创建失败",
			"reason":  err.Error(),
		})
		return
	}
	glog.Info(job)

	// 添加定时任务到 cron 调度器
	jobFunc := JobFunc{Job: job}
	entryID, err := Cron.AddJob(job.Cron, jobFunc)
	if err != nil {
		// revert 之前的"写入数据库"操作，使用 Unscoped 永久删除记录
		err = DB.Unscoped().Delete(&job).Error
		// 响应体
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务在调度器中创建失败",
			"reason":  err.Error(),
		})
		return
	}
	job.EntryID = int(entryID)

	// 输出当前调度器中的所有定时任务
	PrintAllJobsEntryID()

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "定时任务创建成功",
	})
}

// 接口：删除指定定时任务
func DeleteJob(c *gin.Context) {
	// 从 post form 中提取参数
	var job Job
	if c.BindJSON(&job) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}
	// 判断是否已经存在
	if !isJobExistByName(job.Name) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "指定任务不存在",
		})
		return
	}

	// 获取指定 ID 的定时任务在数据库中的 EntryID，因为请求传递过来的 EntryID 不一定正确
	glog.Info(job.ID)
	entryID, err := getJobEntryIDByID(job.ID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "从数据库中获取指定 ID 的定时任务失败",
			"reason":  err.Error(),
		})
		return
	}

	// 根据任务名找到该任务，并删除它
	// 手动软删除: 如果模型有DeletedAt字段，它将自动获得软删除功能！ 那么在调用Delete时不会从数据库中永久删除，而是只将字段DeletedAt的值设置为当前时间。
	// 这里手动进行 update 来软删除
	now := time.Now()
	err = DB.Model(&job).Updates(Job{Name: job.Name + now.String(), Model: gorm.Model{DeletedAt: &now}, EntryID: 0, Status: 1}).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务删除失败",
			"reason":  err.Error(),
		})
		return
	}

	// 在 cron 调度器中删除该任务
	Cron.Remove(cron.EntryID(entryID))

	// 输出当前调度器中的所有定时任务
	PrintAllJobsEntryID()

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "定时任务删除成功",
	})
}

// 接口：更新定时任务
func UpdateJob(c *gin.Context) {
	// 从 post form 中提取参数
	var job Job
	var err error
	if c.BindJSON(&job) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}
	// 判断是否已经存在
	if !isJobExistByID(job.ID) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "指定任务不存在",
		})
		return
	}

	// 获取指定 ID 的定时任务在数据库中的 EntryID，因为请求传递过来的 EntryID 不一定正确
	entryID, err := getJobEntryIDByID(job.ID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "从数据库中获取指定 ID 的定时任务失败",
			"reason":  err.Error(),
		})
		return
	}
	job.EntryID = entryID
	glog.Info(job.EntryID, job.Status)

	// 在 cron 调度器中更新对应任务
	Cron.Remove(cron.EntryID(job.EntryID))
	if job.Status == 0 {
		// status = 0 代表运行， 1 代表暂停
		jobFunc := JobFunc{Job: job}
		entryID, err := Cron.AddJob(job.Cron, jobFunc)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "定时任务在调度器中创建失败",
				"reason":  err.Error(),
			})
			return
		}
		job.EntryID = int(entryID)
	} else {
		job.EntryID = 0
	}

	// 输出当前调度器中的所有定时任务
	PrintAllJobsEntryID()

	// 根据任务名找到该任务，并更新它
	err = DB.Where("id = ?", job.ID).Save(&job).Error
	if err != nil {
		Cron.Remove(cron.EntryID(job.EntryID))
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务更新失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "定时任务更新成功",
	})
}

// 接口：获取所有定时任务
func ListJob(c *gin.Context) {
	// 从 url 获取参数
	var jobs []Job
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "从 url 解析参数失败",
		})
		return
	}
	// 指定要检索的记录数
	err = DB.Limit(limit).Find(&jobs).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务获取失败",
			"reason":  err.Error(),
		})
		return
	}
	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "获取定时任务列表成功",
		"data":    jobs,
	})
}

// 接口：添加通知账户
func AddAccount(c *gin.Context) {
	// 从 post form 中提取参数
	var account Account
	if c.BindJSON(&account) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}

	// 写入数据库
	err := DB.Create(&account).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "通知账户创建失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "通知账户创建成功",
	})
}

// 接口：删除指定通知账户
func DeleteAccount(c *gin.Context) {
	// 从 post form 中提取参数
	var account Account
	if c.BindJSON(&account) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}
	// 判断是否已经存在
	//if !isAccountExistByEmail(account.Email) {
	//	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
	//		"message": "指定通知账户不存在",
	//	})
	//	return
	//}

	// 根据通知账户Email找到该通知账户，并删除它
	// 手动软删除: 如果模型有DeletedAt字段，它将自动获得软删除功能！ 那么在调用Delete时不会从数据库中永久删除，而是只将字段DeletedAt的值设置为当前时间。
	// 这里手动进行 update 来软删除
	now := time.Now()
	err := DB.Model(&account).Updates(Account{Email: account.Email + now.String(), Model: gorm.Model{DeletedAt: &now}}).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "通知账户删除失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "通知账户删除成功",
	})
}

// 接口：更新通知账户
func UpdateAccount(c *gin.Context) {
	// 从 post form 中提取参数
	var account Account
	var err error
	if c.BindJSON(&account) != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
		})
		return
	}
	//// 判断是否已经存在
	//if !isAccountExistByID(account.ID) {
	//	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
	//		"message": "指定通知账户不存在",
	//	})
	//	return
	//}

	// 根据通知账户Email找到该通知账户，并更新它
	err = DB.Where("id = ?", account.ID).Save(&account).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "通知账户更新失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "通知账户更新成功",
	})
}

// 接口：获取所有通知账户
func ListAccount(c *gin.Context) {
	// 从 url 获取参数
	var accounts []Account
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "从 url 解析参数失败",
		})
		return
	}
	// 指定要检索的记录数
	err = DB.Limit(limit).Find(&accounts).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "通知账户列表获取失败",
			"reason":  err.Error(),
		})
		return
	}
	// 抹掉 password 字段
	for i := 0; i < len(accounts); i++ {
		accounts[i].Password = "********"
	}
	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "获取通知账户列表成功",
		"data":    accounts,
	})
}
