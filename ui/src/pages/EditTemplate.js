import React from 'react';
import {
    Form,
    Input,
    Select,
    Button,
} from 'antd';
import { InputCron } from 'antcloud-react-crons'
import { Link } from 'react-router-dom'

const { Option } = Select;
const { TextArea } = Input;

class EditTemplate extends React.Component {
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
                <Form.Item label="模板名称">
                    {getFieldDecorator('name', {
                        rules: [
                            {
                                required: true,
                                message: '请输入模板名称',
                            },
                        ],
                    })(<Input />)}
                </Form.Item>
                <Form.Item label="定时配置">
                    {getFieldDecorator('cron', {
                        rules: [
                            {
                                required: true,
                                message: '请输入定时配置',
                            },
                        ],
                    })(<InputCron lang='zh_CN' type={['minute', 'hour', 'day', 'month', 'week']} />)}
                </Form.Item>
                <Form.Item label="抓取规则">
                    {getFieldDecorator('pattern', {
                        rules: [
                            {
                                required: true,
                                message: '请输入抓取规则',
                            },
                            {
                                type: 'regexp',
                                message: '请输入正则表达式格式的字符串',
                            },
                        ],
                    })(<Input />)}
                </Form.Item>
                <Form.Item label="目标页面编码">
                    {getFieldDecorator('charset', {
                        rules: [
                            {
                                required: true,
                                message: '请选择目标页面编码',
                            },
                        ],
                    })(<Select>
                        <Option value="utf8">utf8</Option>
                        <Option value="gbk">gbk</Option>
                    </Select>)}
                </Form.Item>
                <Form.Item label="邮件内容">
                    {getFieldDecorator('content', {
                        rules: [
                            {
                                required: true,
                                message: '请输入邮件内容',
                            },
                        ],
                    })(<TextArea rows={4} />)}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        创建
                    </Button>
                    <Link to='/template'>
                        <Button style={{ marginLeft: '10px' }}>
                            返回
                        </Button>
                    </Link>
                </Form.Item>
            </Form>
        );
    }
}

export default Form.create()(EditTemplate);
