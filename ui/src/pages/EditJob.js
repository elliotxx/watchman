import React from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    message,
    Typography,
    Icon,
} from 'antd';
import { InputCron } from 'antcloud-react-crons'
import { Link } from 'react-router-dom'
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

class EditJob extends React.Component {
    state = {
        isEdit: false,  // 编辑模式
    };

    constructor(props) {
        super(props);
        if (props.location.state && props.location.state.job) {
            this.state = {
                isEdit: true,
                job: props.location.state.job,
            }
        }
    }

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
                // 发送 post 请求到后端
                let method = this.state.isEdit ? axios.put : axios.post;
                if (this.state.isEdit)
                    values.ID = this.state.job.ID;
                method('http://127.0.0.1:8080/job', values)
                    .then(res => {
                        console.log(res);
                        if (res.status === 200) {
                            if (this.state.isEdit)
                                message.info('定时任务更新成功');
                            else
                                message.info('定时任务创建成功');
                            this.props.history.goBack();
                        }
                    })
                    .catch( e => {
                        console.log(e);
                        if (e && e.response && e.response.data && e.response.data.message)
                            message.error('[ERROR] ' + e.response.data.message);
                        else
                            message.error(e.message);
                    });
            }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Form onSubmit={this.handleSubmit}>
                {/*<PageHeader onBack={() => this.props.history.goBack()} title="定时任务配置" subTitle="This is a subtitle" />*/}
                <Typography.Title level={4} type="secondary"><Icon type="left" onClick={() => this.props.history.goBack()} style={{marginRight: '5px'}}/> 定时任务配置</Typography.Title>
                <hr/>
                <Form.Item label="任务名称">
                    {getFieldDecorator('name', {
                        rules: [
                            {
                                required: true,
                                message: '请输入任务名称',
                            },
                        ],
                        initialValue: this.state.isEdit? this.state.job.name : '',
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
                        initialValue: this.state.isEdit? this.state.job.cron : '',
                    })(<InputCron lang='zh_CN' type={['minute', 'hour', 'day', 'month', 'week']} />)}
                </Form.Item>
                <Form.Item label="目标页面 URL">
                    {getFieldDecorator('url', {
                        rules: [
                            {
                                required: true,
                                message: '请输入目标页面 URL',
                            },
                            {
                                type: 'url',
                                message: '请输入 URL 格式的字符串',
                            },
                        ],
                        initialValue: this.state.isEdit? this.state.job.url : '',
                    })(<Input />)}
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
                        initialValue: this.state.isEdit? this.state.job.pattern : '',
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
                        initialValue: this.state.isEdit? this.state.job.charset : '',
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
                        initialValue: this.state.isEdit? this.state.job.content : '',
                    })(<TextArea rows={4} />)}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        { this.state.isEdit? '提交' : '创建' }
                    </Button>
                    <Link to='/job'>
                        <Button style={{ marginLeft: '10px' }}>
                            返回
                        </Button>
                    </Link>
                </Form.Item>
            </Form>
        );
    }
}

export default Form.create()(EditJob);
