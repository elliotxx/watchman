package api

import (
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
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
			"reason":  err,
		})
		return
	}
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
	// 根据任务名找到该任务，并删除它
	// 手动软删除: 如果模型有DeletedAt字段，它将自动获得软删除功能！ 那么在调用Delete时不会从数据库中永久删除，而是只将字段DeletedAt的值设置为当前时间。
	// 这里手动进行 update 来软删除
	now := time.Now()
	err := DB.Model(&job).Updates(Job{Name: job.Name + now.String(), Model: gorm.Model{DeletedAt: &now}}).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务删除失败",
			"reason":  err,
		})
		return
	}
	// 返回 response
	c.JSON(http.StatusOK, gin.H{
		"message": "定时任务删除成功",
	})
}

// 接口：更新定时任务
func UpdateJob(c *gin.Context) {
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
	if !isJobExistByID(job.ID) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "指定任务不存在",
		})
		return
	}
	// 根据任务名找到该任务，并更新它
	err := DB.Where("id = ?", job.ID).Save(&job).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "定时任务更新失败",
			"reason":  err,
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
			"reason":  err,
		})
		return
	}
	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"message": "获取定时任务列表成功",
		"data":    jobs,
	})
}
