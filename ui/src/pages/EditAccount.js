import React from 'react';
import {
    Form,
    Input,
    Button,
    message,
    Typography,
    Icon,
} from 'antd';
import { Link } from 'react-router-dom'
import axios from 'axios';
import { globalConfig } from '../config'

class EditAccount extends React.Component {
    constructor(props) {
        super(props);

        // 初始化 state
        this.state = {
            isEdit: false,  // 是否为编辑模式
        };
        if (props.location.state && props.location.state.account) {
            this.state.isEdit = true;
            this.state.account = props.location.state.account;
        }
    }

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                // console.log('Received values of form: ', values);
                // 发送 post 请求到后端
                let method = this.state.isEdit ? axios.put : axios.post;
                if (this.state.isEdit)
                    values.ID = this.state.account.ID;
                method(globalConfig.rootPath + '/api/v1/account', values)
                    .then(res => {
                        console.log(res);
                        if (res.status === 200) {
                            if (this.state.isEdit)
                                message.success('通知账户更新成功');
                            else
                                message.success('通知账户创建成功');
                            this.props.history.goBack();
                        }
                    })
                    .catch( e => {
                        if (e && e.response && e.response.data && e.response.data.message){
                            if (e.response.data.reason === "UNIQUE constraint failed: accounts.email") {
                                message.error('该 Email 账户已存在');
                            } else {
                                message.error(e.response.data.message);
                            }
                        } else {
                            message.error(e.message);
                        }
                    });
            }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Form onSubmit={this.handleSubmit}>
                {/*<PageHeader onBack={() => this.props.history.goBack()} title="通知账户配置" subTitle="This is a subtitle" />*/}
                <Typography.Title level={4} type="secondary"><Icon type="left" onClick={() => this.props.history.goBack()} style={{marginRight: '5px'}}/> 通知账户配置</Typography.Title>
                <hr/>
                <Form.Item label="Email">
                    {getFieldDecorator('email', {
                        rules: [
                            {
                                type: 'email',
                                message: '不是有效的 Email',
                            },
                            {
                                required: true,
                                message: '请输入邮件账号 (Email)',
                            },
                        ],
                        initialValue: this.state.isEdit? this.state.account.email : '',
                    })(
                        <Input
                            prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="请输入邮件账号..."
                        />,
                    )}
                </Form.Item>
                <Form.Item label="密码 / 授权码">
                    {getFieldDecorator('password', {
                        rules: [
                            {
                                required: true,
                                message: '请输入密码 / 授权码',
                            },
                        ],
                    })(
                        <Input.Password
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="请输入密码 / 授权码..."
                        />,
                    )}
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        { this.state.isEdit? '提交' : '添加' }
                    </Button>
                    <Link to='/account'>
                        <Button style={{ marginLeft: '10px' }}>
                            返回
                        </Button>
                    </Link>
                </Form.Item>
            </Form>
        );
    }
}

export default Form.create()(EditAccount);
