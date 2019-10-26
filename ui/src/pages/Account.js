import React from 'react';
import { Table, Button, message, Radio, Popconfirm, Badge, Tag, Icon, Tooltip } from 'antd';
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
            width: '30%',
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
            // title: '是否可用',
            title: <Tooltip placement="right" title="可以点击【测试】按钮检测 Email 账号是否可用"> 是否可用 <Icon type="info-circle" theme="twoTone" /></Tooltip>,
            key: 'status',
            dataIndex: 'status',
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
            render: (text, record) => {
                console.log(record);
                return (
                <span>
                    <Radio.Group>
                        <Link to={{pathname: '/editaccount', state: {account: record}}}>
                            <Radio.Button>编辑</Radio.Button>
                        </Link>
                        <Radio.Button onClick={ () => {this.testEmail(record)} } >
                            {record.status === 3 && <Icon type="loading" style={{marginRight: 5}} />}
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
                </span>
            )},
        },
    ];

    testEmail = (record) => {
        // 测试当前 Email 账户的连通性，即是否能用来发送邮件
        let accounts = this.state.accounts;
        let i = accounts.findIndex(item => record.ID === item.ID);
        accounts[i].status = 3;     // loading
        this.setState({ accounts: accounts }, () => {this.forceUpdate()});

        let data = {
            id    : record.ID,
            email : record.email,
            host  : record.host,
            port  : parseInt(record.port),
        };
        // 发送 get 请求到后端
        axios.post(globalConfig.rootPath + '/api/v1/testemail', data)
            .then( () => {
                accounts[i].status = 1;     // success
                this.setState({accounts : accounts});
                message.success("该 Email 账户身份验证通过，可以发送邮件");
            })
            .catch( e => {
                accounts[i].status = 2;     // fail
                this.setState({accounts : accounts});
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                else
                    message.error(e.message);
            });
    };

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
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
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
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
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