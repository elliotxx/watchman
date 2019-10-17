import React from 'react';
import { Table, Button, message, Radio } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { globalConfig } from '../config'


class Account extends React.Component {
    state = {
        'accounts' : [],
    };

    columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '密码 / 授权码',
            dataIndex: 'password',
            key: 'password',
            render: () => ('**********'),
        },
        {
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <span>
                    <Radio.Group>
                        <Link to={{pathname: '/editaccount', state: {account: record}}}>
                            <Radio.Button>编辑</Radio.Button>
                        </Link>
                        <Radio.Button onClick={ () => {this.handleDelete(record)} }>删除</Radio.Button>
                    </Radio.Group>
                </span>
            ),
        },
    ];

    handleDelete = (record) => {
        // 删除按钮响应函数
        axios.delete(globalConfig.rootPath + '/api/v1/account', {data: JSON.stringify(record)})
            .then( res => {
                console.log(res);
                if (res.status === 200) {
                    message.info('删除成功');
                    // 更新 state
                    let afterAccounts = this.state.accounts.filter( v => { return v.ID !== record.ID });
                    this.setState({'accounts': afterAccounts})
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

    syncAccounts() {
        // 同步一次 accounts 数据，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/account')
            .then(res => {
                console.log(res);
                let accounts = res.data.data;
                this.setState({'accounts': accounts});
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
        // 同步一次 accounts 数据
        this.syncAccounts();
    }

    // expandedRowRender = (record) => {
    //     try {
    //         const columns = [
    //             { title: 'row', dataIndex: 'row', key: 'row', width: '10%'},
    //             { title: 'value', dataIndex: 'value', key: 'value' },
    //         ];
    //         const data = [
    //             {
    //                 key: 0,
    //                 row: '目标页面 URL',
    //                 value: record.url,
    //             },
    //             {
    //                 key: 1,
    //                 row: '抓取规则',
    //                 value: record.pattern,
    //             },
    //             {
    //                 key: 2,
    //                 row: '邮件内容',
    //                 value: record.content,
    //             },
    //         ];
    //
    //         return <Table showHeader={false} columns={columns} dataSource={data} pagination={false} />;
    //     } catch (e) {
    //         message.error(e.message);
    //     }
    // };

    render() {
        return (
            <div>
                <Table
                    bordered
                    columns={this.columns}
                    dataSource={this.state.accounts}
                    // expandedRowRender={this.expandedRowRender}
                    pagination={false}
                />

                <Link to='/editaccount'>
                    <Button
                        // type="dashed"
                        style={{width: '100%', margin: '16px 0', height: 40}}
                        icon="plus"
                    >
                        添加账户
                    </Button>
                </Link>
            </div>
        )
    }
}

export default Account;