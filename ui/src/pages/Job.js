import React from 'react';
import {Table, Button, message, Radio, Tag, Badge, Popconfirm, Icon, Tooltip} from 'antd';
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
            width: '25%',
            render: (text) => (
                <div style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}>
                    {text}
                </div>
            ),
        },
        {
            title: '定时配置',
            dataIndex: 'cron',
            key: 'cron',
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
            // title: '抓取规则是否有效',
            title: <Tooltip placement="right" title="可以点击【测试】按钮对抓取规则有效性进行验证"> 抓取规则是否有效 <Icon type="info-circle" theme="twoTone" /></Tooltip>,
            key: 'patternStatus',
            dataIndex: 'patternStatus',
            render: (text) => {
                console.log(text);
                switch (text) {
                    case 1:
                        return <Badge status="success" text={<Tag color="green">可用</Tag>}/>;
                    case 2:
                        return <Badge status="error" text={<Tag color="red">不可用</Tag>}/>;
                    case 3:
                        return <Badge status="processing" text={<Tag color="blue">测试中</Tag>}/>;
                    default:
                        return <Badge status="default" text={<Tag color="gray">未测试</Tag>}/>;
                }
            },
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
                        <Radio.Button onClick={ () => {this.testPattern(record)} } >
                            {record.patternStatus === 3 && <Icon type="loading" style={{marginRight: 5}} />}
                            测试
                        </Radio.Button>
                        <Popconfirm
                            title="真的要删掉我吗？"
                            onConfirm={ () => {this.handleDelete(record)} }
                            okText="是"
                            cancelText="否"
                        >
                            <Radio.Button>删除</Radio.Button>
                        </Popconfirm>
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

    testPattern = (record) => {
        // 测试当前定时任务中抓取规则的有效性，即是否能匹配到内容
        let jobs = this.state.jobs;
        let i = jobs.findIndex(item => record.ID === item.ID);
        console.log(record.ID, i);
        jobs[i].patternStatus = 3;     // loading
        this.setState({ jobs: jobs });

        let data = {
            params: {
                id      : record.ID,
                type    : "re",
                url     : record.url,
                pattern : record.pattern,
            }
        };
        // 发送 get 请求到后端
        axios.get(globalConfig.rootPath + '/api/v1/testpattern', data)
            .then( (response) => {
                jobs[i].patternStatus = 1;     // success
                this.setState({jobs : jobs});
                if (response && response.data && response.data.data)
                    message.success("定时任务【"+jobs[i].name+"】抓取到内容 => "+response.data.data);
                message.success("定时任务【"+jobs[i].name+"】的抓取规则有效");
            })
            .catch( e => {
                jobs[i].patternStatus = 2;     // fail
                this.setState({jobs : jobs});
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error(e.response.data.message);
                else
                    message.error(e.message);
            });
    };

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
                    message.error(e.response.data.message);
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
                    message.success('删除成功');
                    // 更新 state
                    let afterJobs = this.state.jobs.filter( v => { return v.ID !== record.ID });
                    this.setState({'jobs': afterJobs})
                }
            })
            .catch( e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error(e.response.data.message);
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

    UNSAFE_componentWillMount() {
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
                    rowKey="ID"
                    columns={this.columns}
                    dataSource={this.state.jobs}
                    expandedRowRender={this.expandedRowRender}
                    pagination={false}
                    bordered
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