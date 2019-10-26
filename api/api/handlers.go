package api

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang/glog"
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
	"net/http"
	"time"
)

// 接口：添加定时任务
func AddJob(c *gin.Context) {
	// 从 post form 中提取参数
	var job Job
	if err := c.BindJSON(&job); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}
	// 判断是否已经存在
	if isJobExistByName(job.Name) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "该任务名称已经存在",
			"reason":  "",
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
	if err := c.BindJSON(&job); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}
	// 判断是否已经存在
	if !isJobExistByName(job.Name) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "指定任务不存在",
			"reason":  "",
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
	if err = c.BindJSON(&job); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}
	// 判断是否已经存在
	if !isJobExistByID(job.ID) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "指定任务不存在",
			"reason":  "",
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
	//limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	//if err != nil {
	//	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
	//		"message": "从 url 解析参数失败",
	//		"reason":  err.Error(),
	//	})
	//	return
	//}
	// 指定要检索的记录数
	//err = DB.Limit(limit).Find(&jobs).Error
	err := DB.Find(&jobs).Error
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
	if err := c.BindJSON(&account); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
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
	if err := c.BindJSON(&account); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
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
	if err := c.BindJSON(&account); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
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

	// 根据通知账户 ID 找到该通知账户，并更新它
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
	//limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	//if err != nil {
	//	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
	//		"message": "从 url 解析参数失败",
	//		"reason":  err.Error(),
	//	})
	//	return
	//}
	// 指定要检索的记录数
	//err := DB.Limit(limit).Find(&accounts).Error
	err := DB.Find(&accounts).Error
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

// 接口：测试正则表达式匹配效果，返回匹配结果或者报错信息
func TestPattern(c *gin.Context) {
	// 获取参数
	var result string
	var job Job
	var err error
	id := c.Query("id")
	url := c.Query("url")
	pattern := c.Query("pattern")
	patternType := c.DefaultQuery("type", "re")

	// 从数据库中取出指定 id 的定时任务
	// 状态更新不是强要求，所以这里获取失败也没关系
	DB.Where("id = ?", id).First(&job)

	// 根据 url 获取 html 源码
	html, err := GetHtmlByUrl(url)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "获取 html 源码失败",
			"reason":  err.Error(),
		})
		return
	}

	// 根据 pattern 对 html 源码进行匹配
	switch patternType {
	case "re":
		result, err = MatchTargetByRE(html, pattern)
	default:
		err = fmt.Errorf("Pattern type `%s` not found", patternType)
	}
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "抓取规则无效",
			"reason":  err.Error(),
		})
		// 抓取规则无效，更新数据库
		glog.Info(job)
		if job.ID != 0 {
			DB.Model(&job).Update("pattern_status", 2)
		}
		return
	}

	// 抓取规则有效，更新数据库
	if job.ID != 0 {
		DB.Model(&job).Update("pattern_status", 1)
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "pattern 匹配到内容",
		"data":    result,
	})
}

// 接口：测试邮箱账号是否可以发送邮件
func TestEmail(c *gin.Context) {
	// 获取参数
	var account Account
	var err error
	if err = c.BindJSON(&account); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}

	// 如果没请求密码参数，就从数据库中取出密码
	// 判断密码是否为空
	if account.Password == "" {
		var account_tmp Account
		// 空密码，表示请求参数里没有填写密码信息，那么就从数据库中取出该 email 对应的密码
		err = DB.Where("email = ?", account.Email).First(&account_tmp).Error
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "该 Email 账户不存在",
				"reason":  err.Error(),
			})
			return
		}
		account.Password = account_tmp.Password
	}

	// 测试该账户的连通性（该 Email 账户是否能用来发送邮件）
	err = IsConnectedEmail(account)
	if err != nil {
		switch err.Error() {
		case "Error parsing email to suffix":
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "无法正确解析出该 Email 账户的主机和端口号",
				"reason":  err.Error(),
			})
		case "No corresponding host and port found":
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "没有该 Email 账户匹配的主机和端口号，请手动输入",
				"reason":  err.Error(),
			})
		default:
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "该 Email 账户身份验证失败，无法使用",
				"reason":  err.Error(),
			})
		}
		if account.ID != 0 {
			DB.Model(&account).Update("status", 2)
		}
		return
	}

	// 邮箱账户可用，更新数据库
	if account.ID != 0 {
		DB.Model(&account).Update("status", 1)
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "该 Email 账户身份验证通过，可以发送邮件",
	})
}

// 接口：添加任务模板
func AddTemplate(c *gin.Context) {
	// 从 post form 中提取参数
	var template Template
	if err := c.BindJSON(&template); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}

	// 写入数据库
	err := DB.Create(&template).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "任务模板创建失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "任务模板创建成功",
	})
}

// 接口：删除指定任务模板
func DeleteTemplate(c *gin.Context) {
	// 从 post form 中提取参数
	var template Template
	if err := c.BindJSON(&template); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}

	// 根据 Name 找到任务模板，并删除它
	// 手动软删除: 如果模型有DeletedAt字段，它将自动获得软删除功能！ 那么在调用Delete时不会从数据库中永久删除，而是只将字段DeletedAt的值设置为当前时间。
	// 这里手动进行 update 来软删除
	now := time.Now()
	err := DB.Model(&template).Updates(Template{Name: template.Name + now.String(), Model: gorm.Model{DeletedAt: &now}}).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "任务模板删除失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "任务模板删除成功",
	})
}

// 接口：更新任务模板
func UpdateTemplate(c *gin.Context) {
	// 从 post form 中提取参数
	var template Template
	var err error
	if err := c.BindJSON(&template); err != nil {
		// 解析失败
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "JSON 解析失败",
			"reason":  err.Error(),
		})
		return
	}

	// 根据任务模板 ID 找到该任务模板，并更新它
	err = DB.Where("id = ?", template.ID).Save(&template).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "任务模板更新失败",
			"reason":  err.Error(),
		})
		return
	}

	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "任务模板更新成功",
	})
}

// 接口：获取所有任务模板
func ListTemplate(c *gin.Context) {
	// 从 url 获取参数
	var templates []Template
	//limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	//if err != nil {
	//	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
	//		"message": "从 url 解析参数失败",
	//		"reason":  err.Error(),
	//	})
	//	return
	//}
	// 指定要检索的记录数
	//err := DB.Limit(limit).Find(&templates).Error
	err := DB.Find(&templates).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "任务模板列表获取失败",
			"reason":  err.Error(),
		})
		return
	}
	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "获取任务模板列表成功",
		"data":    templates,
	})
}
