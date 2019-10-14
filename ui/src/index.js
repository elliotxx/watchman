import React from 'react';
import ReactDOM from 'react-dom';
import { Layout, Menu, Icon, Typography } from 'antd';
import Job from './pages/Job'
import EditJob from './pages/EditJob'
import Setting from './pages/Setting'
import EditTemplate from './pages/EditTemplate'
import Template from './pages/Template'
import 'antd/dist/antd.css';
import './index.css';
import { HashRouter, Route, Link, Switch } from 'react-router-dom';
import { globalConfig } from "./config";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;


class App extends React.Component {
    state = {
        collapsed: false,
    };

    onCollapse = collapsed => {
        console.log(collapsed);
        this.setState({ collapsed });
    };

    render() {
        // 设置主页标题
        document.title = globalConfig.rootTitle;
        return (
            <HashRouter>
                <Layout style={{ minHeight: '100vh' }}>
                    {/*左侧导航条*/}
                    <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
                        <Title level={4} style={{color:'white', margin:10, textAlign:'center'}}>更夫 (watchman)</Title>
                        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                            <Menu.Item key="1" link='/job'>
                                <Icon type="pie-chart" />
                                <Link to='/job'>定时任务</Link>
                            </Menu.Item>
                            <Menu.Item key="2" link='/setting'>
                                <Icon type="user" />
                                <Link to='/setting'>提醒配置</Link>
                            </Menu.Item>
                            <Menu.Item key="3">
                                <Icon type="file" />
                                <Link to='/template'>模板配置</Link>
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout>
                        <Header style={{ background: '#fff', padding: 0, height: 51, position: 'relative' }} />
                        {/*    <Button style={{ position: 'absolute', top: '20%', marginLeft: '16px' }} onClick={this.goBack}>*/}
                        {/*        <Icon type="left" />*/}
                        {/*        <span>返回</span>*/}
                        {/*    </Button>*/}
                        {/*</Header>*/}
                        {/*右侧显示内容*/}
                        <Content style={{ margin: '16px 16px' }}>
                            {/*面包屑*/}
                            {/*<Breadcrumb >*/}
                            {/*</Breadcrumb>*/}
                            {/*正文*/}
                            <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                                <Switch>
                                    <Route exact path='/' breadcrumbName="首页" component={Job} />
                                    <Route exact path='/job' breadcrumbName="定时任务" component={Job} />
                                    <Route exact path='/editjob' breadcrumbName="创建任务" component={EditJob} />
                                    <Route exact path='/setting' breadcrumbName="提醒配置" component={Setting} />
                                    <Route exact path='/template' breadcrumbName="模板配置" component={Template} />
                                    <Route exact path='/edittemplate' breadcrumbName="创建模板" component={EditTemplate} />
                                </Switch>
                            </div>

                        </Content>
                        <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
                    </Layout>
                </Layout>
            </HashRouter>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
