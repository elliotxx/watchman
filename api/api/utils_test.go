package api

import (
	"testing"
)

func TestWatchJob(t *testing.T) {
	job := Job{
		Name:    "小说 - 凡人修仙传之仙界篇",
		Cron:    "*/1 * * * *",
		Url:     "https://book.qidian.com/info/1010734492",
		Pattern: `<a class="blue" href=".*?" data-eid="qd_G19" data-cid=".*?" title=".*?" target="_blank">(.*?)</a><i>.*?</i><em class="time">.*?</em>`,
		Charset: "utf8",
		Content: "https://www.owllook.net/chapter?url=https://www.qu.la/book/3353/&novels_name=%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0%E4%BB%99%E7%95%8C%E7%AF%87",
		Status:  0,
		EntryID: 0,
	}
	err := WatchJob(job)
	if err != nil {
		t.Error(err)
	}
}
