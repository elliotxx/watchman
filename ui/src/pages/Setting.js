import React from 'react';
import {
    Icon,
    Form,
    Input,
    Button,
} from 'antd';

class Setting extends React.Component {
    state = {
    };

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Form onSubmit={this.handleSubmit}>
                <Form.Item label="邮件账户名">
                    {getFieldDecorator('email', {
                        rules: [
                            {
                                required: true,
                                message: '请输入邮件账号',
                            },
                        ],
                    })(
                        <Input
                            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
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
                        <Input
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            type="password"
                            placeholder="请输入密码 / 授权码..."
                        />,
                    )}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        提交
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

export default Form.create()(Setting);
