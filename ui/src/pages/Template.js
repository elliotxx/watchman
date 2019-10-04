import React from 'react';
import { Table, Divider, Button, message } from 'antd';
import { Link } from 'react-router-dom';


const columns = [
    {
        title: '任务名称',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '定时配置',
        dataIndex: 'cron',
        key: 'cron',
    },
    {
        title: '目标页面编码',
        dataIndex: 'charset',
        key: 'charset',
    },
    {
        title: '操作',
        key: 'action',
        render: (text, record) => (
            <span>
                <a href='/template'>编辑</a>
                <Divider type="vertical" />
                <a href='/template'>删除</a>
            </span>
        ),
    },
];

const data = [
    {
        key: '1',
        name: '起点小说模板',
        cron: "*/10 * * * *",
        pattern: `<a class="blue" href=".*?" data-eid="qd_G19" data-cid=".*?" title=".*?" target="_blank">(.*?)</a><i>.*?</i><em class="time">.*?</em>`,
        charset: "utf8",
        content: "请访问 https://www.owllook.net/chapter?url=https://www.qu.la/book/3353/                                                             &novels_name=%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0%E4%BB%99%E7%95%8C%E7%AF%87 查看小说",
    },
    {
        key: '2',
        name: '笔趣阁小说模板',
        cron: "*/10 * * * *",
        pattern: `<a class="blue" href=".*?" data-eid="qd_G19" data-cid=".*?" title=".*?" target="_blank">(.*?)</a><i>.*?</i><em class="time">.*?</em>`,
        charset: "gbk",
        content: "请访问 https://www.owllook.net/chapter?url=https://www.qu.la/book/3353/                                                             &novels_name=%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0%E4%BB%99%E7%95%8C%E7%AF%87 查看小说",
    },
];

class Template extends React.Component {
    state = {
    };

    expandedRowRender = (record) => {
        try {
            const columns = [
                { title: 'row', dataIndex: 'row', key: 'row', width: '10%'},
                { title: 'value', dataIndex: 'value', key: 'value' },
            ];
            const data = [
                {
                    key: 0,
                    row: '抓取规则',
                    value: record.pattern,
                },
                {
                    key: 1,
                    row: '邮件内容',
                    value: record.content,
                },
            ];

            return <Table showHeader={false} columns={columns} dataSource={data} pagination={false} />;
        } catch (e) {
            message.error(e.message);
        }
    };


    render() {
        return (
            <div>
                <Table
                    bordered
                    columns={columns}
                    dataSource={data}
                    expandedRowRender={this.expandedRowRender}
                    pagination={false}
                />

                <Link to='/edittemplate'>
                    <Button
                        style={{width: '100%', margin: '16px 0', height: 40}}
                        icon="plus"
                    >
                        添加任务模板
                    </Button>
                </Link>
            </div>
        )
    }
}

export default Template;