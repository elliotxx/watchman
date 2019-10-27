import React from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    message,
    Typography,
    Icon,
    Divider,
    Drawer,
    Dropdown,
    Menu,
} from 'antd';
import { InputCron } from 'antcloud-react-crons'
import { Link } from 'react-router-dom'
import axios from 'axios';
import ReactMarkdown from 'react-markdown/with-html';
import { globalConfig } from '../config'

const { Option } = Select;
const { TextArea } = Input;

class EditJob extends React.Component {
    constructor(props) {
        super(props);
        // 首先同步一次数据
        this.getAllAccounts();
        this.getAllTemplates();

        // 初始化 state
        this.state = {
            isEdit: false,              // 是否为编辑模式
            isVisibleDrawer: false,     // 正则手册的抽屉是否可见
            emails: [],                 // 已经添加的通知账户 emails 们
            templates: [],              // 已经添加的任务模板 template 们
            testPatternStatus: "play-circle"        // pattern 测试的状态，play-circle 代表测试前，loading 代表测试中，check-circle 代表测试成功，close-circle 代表测试失败
        };
        if (props.location.state && props.location.state.job) {
            this.state.isEdit = true;
            this.state.job = props.location.state.job;
        }
    }

    getAllAccounts = () => {
        // 获取所有 accounts 数据，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/account')
            .then(res => {
                console.log(res);
                let accounts = res.data.data;
                let emails = accounts.map((account) => {return account.email;});
                this.setState({'emails': emails});
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

    testPattern = () => {
        // 测试当前抓取规则 pattern 的效果
        const { getFieldValue } = this.props.form;

        this.setState({"testPatternStatus" : "loading"});
        let params = {
            params: {
                id : this.state.job && this.state.job.ID ? this.state.job.ID : 0,
                url : getFieldValue("url"),
                type: "re",
                pattern: getFieldValue("pattern"),
            }
        };
        // 发送 get 请求到后端
        axios.get(globalConfig.rootPath + '/api/v1/testpattern', params)
            .then(res => {
                this.setState({"testPatternStatus" : "check-circle"});
                if (res && res.data && res.data.data) {
                    message.success("匹配结果 => " + res.data.data);
                } else {
                    message.error("抓取规则无效");
                }
            })
            .catch( e => {
                this.setState({"testPatternStatus" : "close-circle"});
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                else
                    message.error(e.message);
            });
    };

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
                // 发送 post 请求到后端
                let method = this.state.isEdit ? axios.put : axios.post;
                if (this.state.isEdit)
                    values.ID = this.state.job.ID;
                method(globalConfig.rootPath + '/api/v1/job', values)
                    .then(res => {
                        console.log(res);
                        if (res.status === 200) {
                            if (this.state.isEdit)
                                message.success('定时任务更新成功');
                            else
                                message.success('定时任务创建成功');
                            this.props.history.goBack();
                        }
                    })
                    .catch( e => {
                        console.log(e);
                        if (e && e.response && e.response.data && e.response.data.message)
                            message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                        else
                            message.error(e.message);
                    });
            }
        });
    };

    onShowDrawer = () => {
        this.setState({
            isVisibleDrawer: true,
        });
    };

    onCloseDrawer = () => {
        this.setState({
            isVisibleDrawer: false,
        });
    };

    handleTemplateClick = (e) => {
        // 模板被选中时，填充到表单中
        console.log(e);
        console.log(this.state.templates);
        console.log(e.item.props.children[1]);
        const { setFieldsValue } = this.props.form;
        // 拿到被选中模板的数据
        let selectedTemplate = this.state.templates.filter( v => { return v.name === e.item.props.children[1] });
        if (selectedTemplate.length < 1)
            return ;
        selectedTemplate = selectedTemplate[0];
        // 填充到表单中
        setFieldsValue({
            cron: selectedTemplate.cron,
            pattern: selectedTemplate.pattern,
            content: selectedTemplate.content,
        });
    };

    getAllTemplates = () => {
        // 获取全部任务模板，并更新 state
        axios.get(globalConfig.rootPath + '/api/v1/template')
            .then(res => {
                console.log(res);
                this.setState({'templates': res.data.data});
            })
            .catch(e => {
                console.log(e);
                if (e && e.response && e.response.data && e.response.data.message)
                    message.error("[message] " + e.response.data.message + " [reason] " + e.response.data.reason);
                else
                    message.error(e.message);
            });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        // 填充 email 选择框内容
        let emailOptions = [];
        if (this.state.emails) {
            this.state.emails.forEach(email => {
                emailOptions.push(<Option key={email}>{email}</Option>);
            });
        }

        // 模板下拉框内容
        const templatesContent = this.state.templates.map( (value, index) => (
            <Menu.Item key={index}><Icon type="file"/>{value.name}</Menu.Item>
        ));

        let markdown = `
## 示例

### 匹配页面标题：  
\`\`\`
<title>(.*?)</title>
\`\`\`  
注意：() 中代表要匹配的目标；

### 匹配起点某小说的最新章节：
\`\`\`  
<a class="blue" href=".*?" data-eid="qd_G19" data-cid=".*?" title=".*?" target="_blank">(.*?)</a><i>.*?</i><em class="time">.*?</em>
\`\`\`  
注意：. 代表任意字符，不包括回车符；.*? 代表任意长度（* 代表 0~N 个字符）的字符串；

### 匹配忽略任意字符（包括回车符）：  
\`\`\`  
<div class="lb-z-r-content" id="listChangeDiv">.*?class='lb-z-r-content-b'>[\\s\\S]*?<a href=.*?title='(.*?)'>  
\`\`\`  
注意：[\\s\\S] 代表任意字符，包括回车符；[\\s\\S]*? 代表任意长度（* 代表 0~N 个字符）的字符串；

## 用法
> ref: https://www.cnblogs.com/golove/p/3269099.html

------------------------------

单一：

        .                   匹配任意一个字符，如果设置 s = true，则可以匹配换行符

        [字符类]            匹配“字符类”中的一个字符，“字符类”见后面的说明
        [^字符类]           匹配“字符类”外的一个字符，“字符类”见后面的说明

        \\小写Perl标记       匹配“Perl类”中的一个字符，“Perl类”见后面的说明
        \\大写Perl标记       匹配“Perl类”外的一个字符，“Perl类”见后面的说明

        [:ASCII类名:]       匹配“ASCII类”中的一个字符，“ASCII类”见后面的说明
        [:^ASCII类名:]      匹配“ASCII类”外的一个字符，“ASCII类”见后面的说明

        \\pUnicode普通类名   匹配“Unicode类”中的一个字符(仅普通类)，“Unicode类”见后面的说明
        \\PUnicode普通类名   匹配“Unicode类”外的一个字符(仅普通类)，“Unicode类”见后面的说明

        \\p{Unicode类名}     匹配“Unicode类”中的一个字符，“Unicode类”见后面的说明
        \\P{Unicode类名}     匹配“Unicode类”外的一个字符，“Unicode类”见后面的说明

------------------------------

复合：

        xy             匹配 xy（x 后面跟随 y）
        x|y            匹配 x 或 y (优先匹配 x)

------------------------------

重复：

        x*             匹配零个或多个 x，优先匹配更多(贪婪)
        x+             匹配一个或多个 x，优先匹配更多(贪婪)
        x?             匹配零个或一个 x，优先匹配一个(贪婪)
        x{n,m}         匹配 n 到 m 个 x，优先匹配更多(贪婪)
        x{n,}          匹配 n 个或多个 x，优先匹配更多(贪婪)
        x{n}           只匹配 n 个 x
        x*?            匹配零个或多个 x，优先匹配更少(非贪婪)
        x+?            匹配一个或多个 x，优先匹配更少(非贪婪)
        x??            匹配零个或一个 x，优先匹配零个(非贪婪)
        x{n,m}?        匹配 n 到 m 个 x，优先匹配更少(非贪婪)
        x{n,}?         匹配 n 个或多个 x，优先匹配更少(非贪婪)
        x{n}?          只匹配 n 个 x

------------------------------

分组：

        (子表达式)            被捕获的组，该组被编号 (子匹配)
        (?P<命名>子表达式)    被捕获的组，该组被编号且被命名 (子匹配)
        (?:子表达式)          非捕获的组 (子匹配)
        (?标记)               在组内设置标记，非捕获，标记影响当前组后的正则表达式
        (?标记:子表达式)      在组内设置标记，非捕获，标记影响当前组内的子表达式

        标记的语法是：
        xyz  (设置 xyz 标记)
        -xyz (清除 xyz 标记)
        xy-z (设置 xy 标记, 清除 z 标记)

        可以设置的标记有：
        i              不区分大小写 (默认为 false)
        m              多行模式：让 ^ 和 $ 匹配整个文本的开头和结尾，而非行首和行尾(默认为 false)
        s              让 . 匹配 \\n (默认为 false)
        U              非贪婪模式：交换 x* 和 x*? 等的含义 (默认为 false)

------------------------------

位置标记：

        ^              如果标记 m=true 则匹配行首，否则匹配整个文本的开头（m 默认为 false）
        $              如果标记 m=true 则匹配行尾，否则匹配整个文本的结尾（m 默认为 false）
        \\A             匹配整个文本的开头，忽略 m 标记
        \\b             匹配单词边界
        \\B             匹配非单词边界
        \\z             匹配整个文本的结尾，忽略 m 标记

------------------------------

转义序列：

        \\a             匹配响铃符    （相当于 \\x07）
                       注意：正则表达式中不能使用 \\b 匹配退格符，因为 \\b 被用来匹配单词边界，
                       可以使用 \\x08 表示退格符。
        \\f             匹配换页符    （相当于 \\x0C）
        \\t             匹配横向制表符（相当于 \\x09）
        \\n             匹配换行符    （相当于 \\x0A）
        \\r             匹配回车符    （相当于 \\x0D）
        \\v             匹配纵向制表符（相当于 \\x0B）
        \\123           匹配 8  進制编码所代表的字符（必须是 3 位数字）
        \\x7F           匹配 16 進制编码所代表的字符（必须是 3 位数字）
        \\x{10FFFF}     匹配 16 進制编码所代表的字符（最大值 10FFFF  ）
        \\Q...\\E        匹配 \\Q 和 \\E 之间的文本，忽略文本中的正则语法

        \\\\             匹配字符 \\
        \\^             匹配字符 ^
        \\$             匹配字符 $
        \\.             匹配字符 .
        \\*             匹配字符 *
        \\+             匹配字符 +
        \\?             匹配字符 ?
        \\{             匹配字符 {
        \\}             匹配字符 }
        \\(             匹配字符 (
        \\)             匹配字符 )
        \\[             匹配字符 [
        \\]             匹配字符 ]
        \\|             匹配字符 |

------------------------------------------------------------


可以将“命名字符类”作为“字符类”的元素：

        [\\d]           匹配数字 (相当于 \\d)
        [^\\d]          匹配非数字 (相当于 \\D)
        [\\D]           匹配非数字 (相当于 \\D)
        [^\\D]          匹配数字 (相当于 \\d)
        [[:name:]]     命名的“ASCII 类”包含在“字符类”中 (相当于 [:name:])
        [^[:name:]]    命名的“ASCII 类”不包含在“字符类”中 (相当于 [:^name:])
        [\\p{Name}]     命名的“Unicode 类”包含在“字符类”中 (相当于 \\p{Name})
        [^\\p{Name}]    命名的“Unicode 类”不包含在“字符类”中 (相当于 \\P{Name})

------------------------------------------------------------

说明：

------------------------------

“字符类”取值如下（“字符类”包含“Perl类”、“ASCII类”、“Unicode类”）：
    x                    单个字符
    A-Z                  字符范围(包含首尾字符)
    \\小写字母            Perl类
    [:ASCII类名:]        ASCII类
    \\p{Unicode脚本类名}  Unicode类 (脚本类)
    \\pUnicode普通类名    Unicode类 (普通类)

------------------------------

“Perl 类”取值如下：

    \\d             数字 (相当于 [0-9])
    \\D             非数字 (相当于 [^0-9])
    \\s             空白 (相当于 [\\t\\n\\f\\r ])
    \\S             非空白 (相当于[^\\t\\n\\f\\r ])
    \\w             单词字符 (相当于 [0-9A-Za-z_])
    \\W             非单词字符 (相当于 [^0-9A-Za-z_])

------------------------------

“ASCII 类”取值如下

    [:alnum:]      字母数字 (相当于 [0-9A-Za-z])
    [:alpha:]      字母 (相当于 [A-Za-z])
    [:ascii:]      ASCII 字符集 (相当于 [\\x00-\\x7F])
    [:blank:]      空白占位符 (相当于 [\\t ])
    [:cntrl:]      控制字符 (相当于 [\\x00-\\x1F\\x7F])
    [:digit:]      数字 (相当于 [0-9])
    [:graph:]      图形字符 (相当于 [!-~])
    [:lower:]      小写字母 (相当于 [a-z])
    [:print:]      可打印字符 (相当于 [ -~] 相当于 [ [:graph:]])
    [:punct:]      标点符号 (相当于 [!-/:-@[-反引号{-~])
    [:space:]      空白字符(相当于 [\\t\\n\\v\\f\\r ])
    [:upper:]      大写字母(相当于 [A-Z])
    [:word:]       单词字符(相当于 [0-9A-Za-z_])
    [:xdigit:]     16 進制字符集(相当于 [0-9A-Fa-f])

------------------------------

“Unicode 类”取值如下---普通类：

    C                 -其他-          (other)
    Cc                控制字符        (control)
    Cf                格式            (format)
    Co                私人使用区      (private use)
    Cs                代理区          (surrogate)
    L                 -字母-          (letter)
    Ll                小写字母        (lowercase letter)
    Lm                修饰字母        (modifier letter)
    Lo                其它字母        (other letter)
    Lt                首字母大写字母  (titlecase letter)
    Lu                大写字母        (uppercase letter)
    M                 -标记-          (mark)
    Mc                间距标记        (spacing mark)
    Me                关闭标记        (enclosing mark)
    Mn                非间距标记      (non-spacing mark)
    N                 -数字-          (number)
    Nd                十進制数字      (decimal number)
    Nl                字母数字        (letter number)
    No                其它数字        (other number)
    P                 -标点-          (punctuation)
    Pc                连接符标点      (connector punctuation)
    Pd                破折号标点符号  (dash punctuation)
    Pe                关闭的标点符号  (close punctuation)
    Pf                最后的标点符号  (final punctuation)
    Pi                最初的标点符号  (initial punctuation)
    Po                其他标点符号    (other punctuation)
    Ps                开放的标点符号  (open punctuation)
    S                 -符号-          (symbol)
    Sc                货币符号        (currency symbol)
    Sk                修饰符号        (modifier symbol)
    Sm                数学符号        (math symbol)
    So                其他符号        (other symbol)
    Z                 -分隔符-        (separator)
    Zl                行分隔符        (line separator)
    Zp                段落分隔符      (paragraph separator)
    Zs                空白分隔符      (space separator)

------------------------------

“Unicode 类”取值如下---脚本类：

    Arabic                  阿拉伯文
    Armenian                亚美尼亚文
    Balinese                巴厘岛文
    Bengali                 孟加拉文
    Bopomofo                汉语拼音字母
    Braille                 盲文
    Buginese                布吉文
    Buhid                   布希德文
    Canadian_Aboriginal     加拿大土著文
    Carian                  卡里亚文
    Cham                    占族文
    Cherokee                切诺基文
    Common                  普通的，字符不是特定于一个脚本
    Coptic                  科普特文
    Cuneiform               楔形文字
    Cypriot                 塞浦路斯文
    Cyrillic                斯拉夫文
    Deseret                 犹他州文
    Devanagari              梵文
    Ethiopic                衣索比亚文
    Georgian                格鲁吉亚文
    Glagolitic              格拉哥里文
    Gothic                  哥特文
    Greek                   希腊
    Gujarati                古吉拉特文
    Gurmukhi                果鲁穆奇文
    Han                     汉文
    Hangul                  韩文
    Hanunoo                 哈鲁喏文
    Hebrew                  希伯来文
    Hiragana                平假名（日语）
    Inherited               继承前一个字符的脚本
    Kannada                 坎那达文
    Katakana                片假名（日语）
    Kayah_Li                克耶字母
    Kharoshthi              卡罗须提文
    Khmer                   高棉文
    Lao                     老挝文
    Latin                   拉丁文
    Lepcha                  雷布查文
    Limbu                   林布文
    Linear_B                B类线形文字（古希腊）
    Lycian                  利西亚文
    Lydian                  吕底亚文
    Malayalam               马拉雅拉姆文
    Mongolian               蒙古文
    Myanmar                 缅甸文
    New_Tai_Lue             新傣仂文
    Nko                     Nko文
    Ogham                   欧甘文
    Ol_Chiki                桑塔利文
    Old_Italic              古意大利文
    Old_Persian             古波斯文
    Oriya                   奥里亚文
    Osmanya                 奥斯曼亚文
    Phags_Pa                八思巴文
    Phoenician              腓尼基文
    Rejang                  拉让文
    Runic                   古代北欧文字
    Saurashtra              索拉什特拉文（印度县城）
    Shavian                 萧伯纳文
    Sinhala                 僧伽罗文
    Sundanese               巽他文
    Syloti_Nagri            锡尔赫特文
    Syriac                  叙利亚文
    Tagalog                 塔加拉文
    Tagbanwa                塔格巴努亚文
    Tai_Le                  德宏傣文
    Tamil                   泰米尔文
    Telugu                  泰卢固文
    Thaana                  塔安那文
    Thai                    泰文
    Tibetan                 藏文
    Tifinagh                提非纳文
    Ugaritic                乌加里特文
    Vai                     瓦伊文
    Yi                      彝文

------------------------------------------------------------

注意：

　　对于 [a-z] 这样的正则表达式，如果要在 [] 中匹配 - ，可以将 - 放在 [] 的开头或结尾，例如 [-a-z] 或 [a-z-]

　　可以在 [] 中使用转义字符：\\f、\\t、\\n、\\r、\\v、\\377、\\xFF、\\x{10FFFF}、\\\\、\\^、\\$、\\.、\\*、\\+、\\?、\\{、\\}、\\(、\\)、\\[、\\]、\\|（具体含义见上面的说明）

　　如果在正则表达式中使用了分组，则在执行正则替换的时候，“替换内容”中可以使用 $1、$\{1}、$name、$\{name} 这样的“分组引用符”获取相应的分组内容。其中 $0 代表整个匹配项，$1 代表第 1 个分组，$2 代表第 2 个分组，……。

　　如果“分组引用符”是 $name 的形式，则在解析的时候，name 是取尽可能长的字符串，比如：$1x 相当于 $\{1x}，而不是$\{1}x，再比如：$10 相当于 $\{10}，而不是 $\{1}0。

　　由于 $ 字符会被转义，所以要在“替换内容”中使用 $ 字符，可以用 \\$ 代替。

　　上面介绍的正则表达式语法是“Perl 语法”，除了“Perl 语法”外，Go 语言中还有另一种“POSIX 语法”，“POSIX 语法”除了不能使用“Perl 类”之外，其它都一样。

------------------------------------------------------------
`;

        return (
            <div id="job-form">
                <Form onSubmit={this.handleSubmit}>
                    {/*<PageHeader onBack={() => this.props.history.goBack()} title="定时任务配置" subTitle="This is a subtitle" />*/}
                    <div id="edit-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }} >
                        <Typography.Title level={4} type="secondary"><Icon type="left" onClick={() => this.props.history.goBack()} style={{marginRight: '5px'}}/> 定时任务配置</Typography.Title>
                        <Dropdown overlay={<Menu onClick={this.handleTemplateClick}>{templatesContent}</Menu>} onFocus={this.getAllTemplates}>
                            <Button>
                                选择模板 <Icon type="down" />
                            </Button>
                        </Dropdown>
                    </div>
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
                    <Form.Item label={(
                        <span>抓取规则
                            <Divider type="vertical" />
                            <Button
                                type="primary"
                                size="small"
                                icon="book"
                                onClick={this.onShowDrawer}
                                ghost
                            >
                                正则手册
                            </Button>
                            <Divider type="vertical" />
                            <Button
                                type="primary"
                                size="small"
                                icon={this.state.testPatternStatus}
                                onClick={this.testPattern}
                                ghost
                            >
                                测试
                            </Button>
                        </span>
                    )} extra="[\s\S] 可代表任意字符，包括回车符" colon={false}
                    >
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
                        })(<TextArea rows={4} />)}
                    </Form.Item>
                    <Form.Item label="通知账户">
                        {getFieldDecorator('email', {
                            rules: [
                                {
                                    required: true,
                                    message: '请选择通知账户 Email',
                                },
                            ],
                            initialValue: this.state.isEdit? this.state.job.email : '',
                        })(<Select onFocus={this.getAllAccounts}>{emailOptions}</Select>)}
                    </Form.Item>
                    <Form.Item label="邮件内容" extra="内容中可使用变量: %name% 代表定时任务名称，%target% 代表抓取规则匹配到的目标" >
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
                    <Form.Item label="" style={{disable: true}}>
                        {getFieldDecorator('entryId', {
                            initialValue: this.state.isEdit? this.state.job.entryId : 0,
                            // initialValue: 0,
                        })(<div/>)}
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

                {/* 正则手册的抽屉 */}
                <Drawer
                    title="正则表达式使用手册"
                    placement="right"
                    width={800}
                    closable={true}
                    onClose={this.onCloseDrawer}
                    visible={this.state.isVisibleDrawer}
                    style={{wordWrap: 'break-word'}}
                >
                    <ReactMarkdown source={markdown} />
                </Drawer>
            </div>
        );
    }
}

export default Form.create()(EditJob);
