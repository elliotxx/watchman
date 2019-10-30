import React from 'react';
import { globalConfig } from '../config'

// 日志显示样式：命令行样式，白底黑字
const ConsoleCSS = {
    color: 'white',
    background: 'black',
    minHeight: '360px',
    height: '720px',
    padding: '24px',
    margin: '-24px',
    whiteSpace: 'pre-wrap',
    borderRadius: 8,
    overflow: 'auto',
    fontSize: '12px',
};

class Log extends React.Component {
    state = {
        log : '',
    };

    constructor(props) {
        super(props);

        // 初始化 websocket
        let temp = globalConfig.rootPath.split('//');
        let host = temp.length > 1 ?
            temp[temp.length-1] :
            window.location.hostname; // 不指定 rootPath（为空），就使用当前 hostname
        let ws = new WebSocket("ws://" + host + '/api/v1/websocket');

        // websocket 的响应函数
        ws.onopen = (evt) => {
            console.log("Connection open ...");
            console.log(evt);
            ws.send("Hello WebSockets!");
        };

        ws.onmessage = (evt) => {
            // console.log( "Received Message: " + evt.data);
            let oldLog = this.state.log;
            let deltaLog = evt.data + '\n';
            let newLog = oldLog + deltaLog;
            if (newLog.length > globalConfig.LogMaxLength) {
                // 如果超出，从头剔除超出部分
                newLog = newLog.slice(newLog.length - globalConfig.LogMaxLength, newLog.length);
            }
            // 写入到 web console 中
            this.setState( { log : newLog } );
        };

        ws.onclose = (evt) => {
            console.log("Connection closed.");
            console.log(evt);
        };
    };

    // componentDidUpdate() {
    //     console.log(this.logConsole.scrollHeight);
    //     if (this.logConsole) {
    //         const scrollHeight = this.logConsole.scrollHeight;
    //         this.logConsole.scrollTop = scrollHeight;
    //     }
    // }

    render() {
        return (
            <div id="logConsole" ref={(el) => { this.logConsole = el; }}  style={ConsoleCSS} >
                {this.state.log}
            </div>
        )
    }
}

export default Log;