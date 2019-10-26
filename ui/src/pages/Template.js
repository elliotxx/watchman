import React from 'react';
import {Table, Button, message, Radio, Popconfirm} from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { globalConfig } from '../config'


class Template extends React.Component {
    state = {
        'templates' : [],
    };

    columns = [
        // {
        //     title: <Tooltip placement="right" title="任务模板在调度器中的 ID"> EntryID <Icon type="info-circle" theme="twoTone" /></Tooltip>,
        //     dataIndex: 'entryId',
        //     key: 'entryId',
        // },
        {
            title: '模板名称',
            dataIndex: 'name',
            key: 'name',
            width: '35%',
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
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <span>
                    <Radio.Group>
                        <Link to={{pathname: '/edittemplate', state: {template: record}}}>
                            <Radio.Button>编辑</Radio.Button>
                        </Link>
                        <Popconfirm
                            title="真的要删掉我吗？"
                            onConfirm={ () => {this.handleDelete(record)} }
                            okText="是"
                            cancelText="否"
                        >
                            <Radio.Button>删除</Radio.Button>
                        </Popconfirm>
                    </Radio.Group>
                </span>
            ),
        },
    ];

    handleDelete = (record) => {
        // 删除按钮响应函数
        axios.delete(globalConfig.rootPath + '/api/v1/template', {data: JSON.stringify(record)})
            .then( res => {
                console.log(res);
                if (res.status === 200) {
                    message.success('删除成功');
                    // 更新 state
                    let afterTemplates = this.state.templates.filter( v => { return v.ID !== record.ID });
                    this.setState({'templates': afterTemplates})
                }
            })
            .catch( e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                else
                    message.error(e.message);
            });
    };

    syncTemplates() {
        // 同步一次 templates 数据，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/template')
            .then(res => {
                console.log(res);
                let templates = res.data.data;
                this.setState({'templates': templates});
            })
            .catch(e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                else
                    message.error(e.message);
            });
    }

    UNSAFE_componentWillMount() {
        // 同步一次 templates 数据
        this.syncTemplates();
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
                    rowKey="ID"
                    columns={this.columns}
                    dataSource={this.state.templates}
                    expandedRowRender={this.expandedRowRender}
                    pagination={false}
                    bordered
                />

                <Link to='/edittemplate'>
                    <Button
                        // type="dashed"
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