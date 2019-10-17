import React from 'react';
import { Table, Button, message, Radio, Tag, Badge } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { globalConfig } from '../config'


class Job extends React.Component {
    state = {
        'jobs' : [],
    };

    columns = [
        // {
        //     title: <Tooltip placement="right" title="定时任务在调度器中的 ID"> EntryID <Icon type="info-circle" theme="twoTone" /></Tooltip>,
        //     dataIndex: 'entryId',
        //     key: 'entryId',
        // },
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
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (text, record) => {
                if (record.status === 0)
                    return <Badge color="green" text={<Tag color="green">运行中</Tag>} />;
                else if (record.status === 1)
                    return <Badge color="red" text={<Tag color="red">已暂停</Tag>} />;
            }
        },
        {
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <span>
                    <Radio.Group>
                        <Link to={{pathname: '/editjob', state: {job: record}}}>
                            <Radio.Button>编辑</Radio.Button>
                        </Link>
                        <Radio.Button onClick={ () => {this.handleSwitch(record)} }>{ record.status === 0 ? '暂停' : '开始' }</Radio.Button>
                        <Radio.Button onClick={ () => {this.handleDelete(record)} }>删除</Radio.Button>
                    </Radio.Group>
                    {/*<Link to={{pathname: '/editjob', state: {job: record}}}>*/}
                        {/*<Button type="primary" ghost>编辑</Button>*/}
                    {/*</Link>*/}
                    {/*<Divider type="vertical" />*/}
                    {/*<Button type="primary" ghost onClick={ () => {this.handleDelete(record)} }>删除</Button>*/}
                </span>
            ),
        },
    ];

    handleSwitch = (record) => {
        // 暂停/开始按钮响应函数
        record.status = record.status === 0 ? 1 : 0;
        axios.put(globalConfig.rootPath + '/api/v1/job', record)
            .then( res => {
                console.log(res);
                if (res.status === 200) {
                    // 更新 state
                    let index = this.state.jobs.findIndex( v => { return v.ID === record.ID } );
                    let afterJobs = this.state.jobs;
                    afterJobs[index].status = record.status;
                    this.setState({'jobs': afterJobs})
                }
            })
            .catch( e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error('[ERROR] ' + e.response.data.message);
                else
                    message.error(e.message);
            });
    };

    handleDelete = (record) => {
        // 删除按钮响应函数
        axios.delete(globalConfig.rootPath + '/api/v1/job', {data: JSON.stringify(record)})
            .then( res => {
                console.log(res);
                if (res.status === 200) {
                    message.info('删除成功');
                    // 更新 state
                    let afterJobs = this.state.jobs.filter( v => { return v.ID !== record.ID });
                    this.setState({'jobs': afterJobs})
                }
            })
            .catch( e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error('[ERROR] ' + e.response.data.message);
                else
                    message.error(e.message);
            });
    };

    syncJobs() {
        // 同步一次 jobs 数据，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/job')
            .then(res => {
                console.log(res);
                let jobs = res.data.data;
                this.setState({'jobs': jobs});
            })
            .catch(e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error(e.response.data.message);
                else
                    message.error(e.message);
            });
    }

    componentWillMount() {
        // 同步一次 jobs 数据
        this.syncJobs();
    }

    expandedRowRender = (record) => {
        try {
            const columns = [
                { title: 'row', dataIndex: 'row', key: 'row', width: '10%'},
                { title: 'value', dataIndex: 'value', key: 'value' },
            ];
            const data = [
                {
                    key: 0,
                    row: '目标页面 URL',
                    value: record.url,
                },
                {
                    key: 1,
                    row: '抓取规则',
                    value: record.pattern,
                },
                {
                    key: 2,
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
                    columns={this.columns}
                    dataSource={this.state.jobs}
                    expandedRowRender={this.expandedRowRender}
                    pagination={false}
                />

                <Link to='/editjob'>
                    <Button
                        // type="dashed"
                        style={{width: '100%', margin: '16px 0', height: 40}}
                        icon="plus"
                    >
                        添加定时任务
                    </Button>
                </Link>
            </div>
        )
    }
}

export default Job;