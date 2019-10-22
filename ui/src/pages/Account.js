import React from 'react';
import { Table, Button, message, Radio, Popconfirm } from 'antd';
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
            width: '40%',
            render: (text) => (
                <div style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}>
                    {text}
                </div>
            ),
        },
        {
            title: '密码 / 授权码',
            dataIndex: 'password',
            key: 'password',
            render: () => ('********'),
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

    UNSAFE_componentWillMount() {
        // 同步一次 accounts 数据
        this.syncAccounts();
    }

    handleDelete = (record) => {
        // 删除按钮响应函数
        // 删除前，判断是否满足至少有一个通知账户
        if (this.state.accounts.length <= 1) {
            // 不能再删除了
            message.warning("至少应有一个通知账户");
            return ;
        }
        // 删除
        axios.delete(globalConfig.rootPath + '/api/v1/account', {data: JSON.stringify(record)})
            .then( res => {
                console.log(res);
                if (res.status === 200) {
                    message.success('删除成功');
                    // 更新 state
                    let afterAccounts = this.state.accounts.filter( v => { return v.ID !== record.ID });
                    this.setState({'accounts': afterAccounts});
                    // 删除之后，检查是否至少有一个账户，如果不是，则跳转到添加账户页面
                    this.validateAtLeastOneEmail(afterAccounts);
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

    syncAccounts = () => {
        // 同步一次 accounts 数据，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/account')
            .then(res => {
                console.log(res);
                let accounts = res.data.data;
                this.setState({'accounts': accounts});
                // 同步之后，检查是否至少有一个账户，如果不是，则跳转到添加账户页面
                this.validateAtLeastOneEmail(accounts);
            })
            .catch(e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error(e.response.data.message);
                else
                    message.error(e.message);
            });
    };

    validateAtLeastOneEmail = (accounts) => {
        // 检查是否至少有一个账户，如果不是，则跳转到添加账户页面
        if (accounts.length === 0) {
            message.warning("请至少添加一个通知账户");
            this.props.history.push('/editaccount');
        }
    };

    render() {
        return (
            <div>
                <Table
                    rowKey="ID"
                    columns={this.columns}
                    dataSource={this.state.accounts}
                    pagination={false}
                    bordered
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