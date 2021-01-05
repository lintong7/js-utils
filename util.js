/**
 * @description: 公共JS库
 * @author: lintong
 * @date: 2020/07/22 15:27:55 下午
 */
$.getScript('/public/common/utils/handle.js');

/**
 * 关键字高亮
 * @param dom   指定节点
 * @param array 需要高亮的节点index的数组集合
 * @param kw    关键字高亮
 * @param node  指定子节点
 */
highlight = (dom, array, kw, node = 'td') => {
    //所有匹配的元素都替换的正则，如需要所有匹配元素都高亮。将replace(regexp/substr,replacement);第一个参数使用regexp。
    //re = new RegExp("string","g"); //regexp
    let trArr = dom;
    for (let i = 0; i < trArr.length; i++) {
        Object.keys(array).forEach(key => {
            let field = trArr.eq(i).find(node).eq(array[key]).html();
            let highlight = field.replace(kw, "<span class='highlight'>" + kw + "</span>");
            trArr.eq(i).find(node).eq(array[key]).html(highlight);
        });
    }
}

/**
 * 生成layui列表框
 * @param json_data 内容，二维数组
 * @param column_name_arr 列名，一维数组
 * @param title 弹窗标题
 * @param colgroup 指定列宽，一维数组
 * @param display 列表样式，x:表示横向列表，y:表示纵向列表
 * @param area 指定列宽，一维数组
 * @param btn_arr 底部按钮组，默认：返回
 * @param id 设置该值后，不管是什么类型的层，都只允许同时弹出一个。一般用于页面层和iframe层模式
 * @returns {boolean}
 */
layui_list = (json_data = [], column_name_arr = [], title = '查看', colgroup = [], display = 'x', area = ['600px'], btn_arr = [], id = null) => {
    if (json_data.length == 0) {
        layer.msg('暂无数据');
        return false;
    }
    //正文
    let content = '';
    if (display == 'x') {
        content += `<table lay-even lay-skin="line" class="layui-table">`;
        if (colgroup.length > 0) {
            content += `<colgroup>`;
            for (let i = 0; i < colgroup.length; i++) {
                content += `<col width="${colgroup[i]}">`;
            }
            content += `</colgroup>`;
        }
        content += `<thead>
        <tr>`;
        Object.values(column_name_arr).forEach(column_name => {
            content += `<th>${column_name}</th>`;
        });
        content += `
        </tr> 
      </thead>
      <tbody>`;
        content += buildLayuiListContent(json_data, column_name_arr);
        content += `</tbody>
    </table>`;
    } else if (display == 'y') {
        content += `<table class="layui-table">`;
        for (let i = 0; i < json_data.length; i++) {
            Object.values(json_data[i]).forEach(item => {
                if (item.btn == undefined) {
                    content += `<tr><td>` + item.label + `</td><td>` + item.value + `</td></tr>`;
                } else if (item.btn != '') {
                    btn.push(item.btn);
                }
            });
        }
        content += `</table>`;
    }

    //自定义样式
    content += `<style>`;
    content += `
        .layui-layer-btn{margin: 0;padding-top: 0!important;}
        .layui-layer-content{overflow: visible !important;} /*解决遮罩层被挡住问题*/
    `;
    content += `</style>`;

    //基础弹窗配置项
    let layer_option = {content, type: 1, area, title, id, maxmin: true};

    //自定义按钮配置
    if (btn_arr.length < 1 || btn_arr == 'undefined') {
        //按钮1的回调是yes
        layer_option.btn = ['返回'];
        layer_option.yes = function (index, layero) {
            layer.close(index);
        };
    } else {
        //遍历btn对象，绑定按钮事件
        const btnObj = buildLayerBtnObj(btn_arr);

        Object.assign(layer_option, btnObj.layer_option);
        layer_option.btn = btnObj.btnArr;
    }

    //如果唯一标志，则关闭所有弹窗，重新弹窗
    if (id) {
        layer.closeAll();
        eval("var " + id + "=" + layer.open(layer_option));
        return false;
    }
    layer.open(layer_option);
}

/**
 * 生成layui弹窗“编辑”框
 * @param json 内容，二维数组
 * @param title 弹窗标题
 * @param area 指定列宽，一维数组
 * @param params 额外配置项
 * @returns {string}
 */
layui_edit = (json, title = false, area = ['600px', '300px'], params = []) => {
    let method = params.hasOwnProperty('method') ? `method="${params.method}"` : '';
    let form_id = params.hasOwnProperty('id') ? params.id : 'form';
    let content = `<form class="layui-form" ${method} id="${form_id}" lay-filter="${params.id}">`;

    Object.values(json).forEach(item => {
        let star = item.hasOwnProperty('required') && item.required ? '<span>*</span>' : '';//必选项 label标题

        //隐藏域
        if (item.type == 'hidden') {
            content += `<input type="hidden" name="${item.name}" value="${item.value}">`;
            return true;
        }

        content += `
        <div class="layui-form-item layui-form-text">
            <label class="layui-form-label">${star} ${item.label}：</label>
            <div class="layui-input-block">`;

        //input框
        if (['text', 'url', 'number', 'password', 'date'].includes(item.type)) {
            content += `<input type="${item.type}" autocomplete="on" class="layui-input" `;
            Object.keys(item).forEach(key => {
                content += key + `="${item[key]}" `;
            });
            content += `>`;
        }

        //自定义内容，如：标题，上传图片等等
        if (item.type == 'content') {
            content += `<div style="line-height: 36px;">${item.data}</div>`;
        }

        //下拉框
        if (item.type == 'select') {
            //判断是否是数组，是，则内嵌栅格化，否则直接显示
            //let isArray = Array.isArray(item.data); // object
            let disabled = item.hasOwnProperty('disabled') ? 'disabled' : ''; //只读
            content += `<select id="${item.name}" name="${item.name}" lay-verify="required" lay-filter="${item.name}">`;
            if (item.hasOwnProperty('default')) {
                content += `<option value="${item.default[0]}">${item.default[1]}</option>`;
            } else {
                content += item.hasOwnProperty('notDefault') && item.notDefault ? '' : '<option value="">请选择</option>';
            }
            //循环data，将data中的json数据循环输出
            Object.keys(item.data).forEach(key => {
                //默认selected选中的值
                let selected = item.selected == key ? `selected="selected"` : '';
                content += `<option value="${key}" ${disabled} ${selected}>${item.data[key]}</option>`;
            });
            content += `</select>`;
        }

        //单选框
        if (item.type == 'radio') {
            Object.keys(item.data).forEach(key => {
                //默认被选中的值
                let checked = item.checked == item.value[key] ? `checked="checked"` : '';
                content += `<input type="radio" name="${item.name}" title="${item.data[key]}" value="${item.value[key]}" ${checked}>`;
            });
        }

        //复选框
        if (item.type == 'checkbox') {
            let label_arr = item.title;
            //复选框
            for (let i = 0; i < item.title.length; i++) {
                for (let j = 0; j < item.checked.length; j++) {
                    if (item.value[i] == item.checked[j]) {
                        content += `<input type="checkbox" name="${item.name}[${item.value[i]}]" title="${item.title[i]}" value="${item.value[i]}" lay-skin="primary" checked="checked">`;
                        //删除重复项
                        let index = item.title.indexOf(item.title[i]);
                        index > -1 ? item.title.splice(index, 1) : null;
                        let value = item.value.indexOf(item.value[i]);
                        value > -1 ? item.value.splice(value, 1) : null;
                    }
                }
            }
            //标签名
            for (let i = 0; i < label_arr.length; i++) {
                content += `<input type="checkbox" name="${item.name}[${item.value[i]}]" title="${item.title[i]}" value="${item.value[i]}" lay-skin="primary">`;
            }
        }

        //开启|关闭
        if (item.lay) {
            let params = JSON.stringify(params);
            let onswitch = item.value == '1' ? 'layui-form-onswitch' : '';
            let switch_str = item.value == '1' ? 'checked' : '';
            content += `<input class="layui-unselect layui-form-switch ${onswitch}" lay-text="开启|关闭" ${switch_str}
                            name="${item.name}" onclick="${eval(item.event + '(' + params + ')')}" lay-skin="switch">`;
        }

        //多行文本框
        if (item.type == "textarea") {
            content += `<textarea placeholder="${item.type}" value="${item.value}" class="layui-textarea"></textarea>`;
        }

        //表单 tips
        if (item.hasOwnProperty('tips')) {
            content += "<p><span class='star'>*</span>" + item.tips + "</p>";
        }

        content += `</div></div>`;
    });
    //补充html代码
    if (params.hasOwnProperty('extra_html')) {
        content += params.extra_html;
    }
    content += `</form>`;
    //自定义样式
    content += `<style>`;
    content += `
        .layui-form{margin: 20px;}
        .layui-layer-content{overflow: visible !important;} /*解决遮罩层被挡住问题*/
    `;
    //自定义标签宽度
    if (params.hasOwnProperty('label_width')) {
        content += `
        .layui-form-label {width: ${params.label_width}!important;}
        .layui-input-block {margin-left: ${params.label_width}!important;}
        `;
    }

    content += `</style>`;

    //基础弹窗配置项
    let layer_option = {content, type: 1, area, title, resize: false, shadeClose: true};

    //自定义右上角关闭事件
    layer_option.cancel = function () {
        return location.reload();//暂时未解决二次渲染不能显示的问题，直接刷新界面
    }

    //自定义按钮配置
    const btn = params.hasOwnProperty('btn') ? params.btn : [];
    if (btn.length < 1) {
        //按钮1的回调是yes
        layer_option.btn = ['返回'];
        layer_option.yes = function (index) {
            layer.close(index);
        };
    } else {
        //遍历btn对象，绑定按钮事件
        const btnObj = buildLayerBtnObj(btn, form_id);
        Object.assign(layer_option, btnObj.layer_option);
        layer_option.btn = btnObj.btnArr;
    }

    //自定义监听事件
    if (params.hasOwnProperty('bindEvent')) {
        window[params.bindEvent].call();
    }

    //如果唯一标志，则关闭所有弹窗，重新弹窗
    if (params.hasOwnProperty('layui_id')) {
        layer.closeAll();
        eval("var " + params.layui_id + "=" + layer.open(layer_option));
        return false;
    }
    layer.open(layer_option);
}

//构建layui弹窗 按钮事件
buildLayerBtnObj = (btn = [], form_id = 'form') => {
    //遍历btn数组，绑定按钮事件
    let btnArr = [];//按钮名称
    let layer_option = {};//按钮事件
    for (let i = 0; i < btn.length; i++) {
        btnArr.push(btn[i]['name']);
        //按钮1的回调是yes，而从按钮2开始，则回调为btn2: function(){}，以此类推。
        let btn_key_str = i == 0 ? 'yes' : 'btn' + (i + 1);
        if (btn[i].hasOwnProperty("bindEvent")) {
            let bindEvent = btn[i]['bindEvent'];
            eval("layer_option." + btn_key_str + "=" + function (index, layero) {
                switch (bindEvent) {
                    case 'refresh':
                        return location.reload();
                    case 'close':
                        return layer.close(index);
                    case 'submit':
                        return $(`#${form_id}`).submit();
                    default:
                        eval(bindEvent);
                    //window[bindEvent].call(event_param_obj);
                }
            });
        } else if (btn[i].hasOwnProperty("url")) {
            eval("layer_option." + btn_key_str + "=" + function (index, layero) {
                window.location.href = btn[i]['url'];
            });
        }
    }

    return {"btnArr": btnArr, "layer_option": layer_option};
}

//生成layui列表框content内容
buildLayuiListContent = (json, column) => {
    let content = "";
    for (let i = 0; i < json.length; i++) {
        content += `<tr>`;
        Object.keys(column).forEach(key => {
            const item = column[key];
            if (typeof json[i][key] == 'object') {
                let col_text = '';
                let col_obj = json[i][key];
                if (typeof col_obj['type'] != 'undefined') {
                    switch (col_obj['type']) {
                        case 'link':
                            let col_title = item.hasOwnProperty('showTitle') && item.showTitle ? `title="${col_obj['value']}"` : '';
                            col_text = `
                        <a 
                        href="${col_obj['url'] ? col_obj['url'] : '#'}" 
                        onclick="eval(${col_obj['event']})"
                        ${col_title} 
                        style="color:${col_obj['color']}">
                        ${col_obj['label']}
                        <section class="layui-hide">${col_obj['content']}</section>
                        </a>`;
                            break;
                        case 'button':
                            col_text = `
                            <button class="layui-btn ${col_obj['class']}" onclick="${col_obj['event']}">${col_obj['label']}</button>
                            `;
                            break;
                        //...
                        default:
                            col_text = '-';
                            break;
                    }
                    content += `<td>${col_text}</td>`;
                    return true;
                }
            }
            content += `<td>${json[i][key]}</td>`;
        });
        content += `</tr>`;
    }
    return content;
}

/**
 * 生成layui搜索框
 * @param json 二维数组
 * @param extra 额外参数
 * @returns {string}
 */
layui_search = (json, extra = {}) => {
    let form_head = '<form action="" class="layui-form search-form">'; //遍历自定义按钮，如果包含阻止form提交事件时，会被追加替换
    let content = '';
    let onSubmit = false;
    Object.keys(json).forEach(index => {
        const item = json[index];
        //隐藏域
        if (item.type == 'hidden') {
            content += `<input type="hidden" name="${item.name}" value="${item.value}">`;
            return true;
        }
        content += `<div class="layui-inline">`;
        //第一条数据得加上label, 作为开始的标签
        item.label ? content += `<span class="data-screening-title">${item.label}：</span>` : '';
        if (item.type == "text") {
            let hasTitle = item.no_title && item.no_title == true ? true : false;
            switch (item.id) {
                case 'date':
                    content += hasTitle == false ? `<span class="data-screening-title">日期：</span>` : '';
                    break;
                case 'start-date':
                    content += hasTitle == false ? `<span class="data-screening-title">开始日期：</span>` : '';
                    break;
                case 'end-date':
                    content += hasTitle == false ? `<span class="data-screening-title">结束日期：</span>` : '';
                    break;
                default:
                    break;
            }

            content += `<input `;
            for (let key in item) {
                content += `${key}="${item[key]}"`;
            }

            let buildDateObj = (el, date_type, today, param = {}) => {
                return `<script>
                    layui.use('laydate', function(){
                        let laydate = layui.laydate;		  
                        lay('.${el}').each(function(){
                            let base_date_param = {
                                elem: this
                                , trigger: 'click'
                                , type: '${date_type}'
                            };
                            "${date_type}" == "date" ? base_date_param.max = "${today}" : null;   //不指定最小/大日期，默认：最大日期为当天
                            ${param.hasOwnProperty('min')} ? base_date_param.min = "${param.min}" : null; //最小日期
                            ${param.hasOwnProperty('max')} ? base_date_param.max = "${param.max}" : null; //最大日期
                            laydate.render(base_date_param);
                        });
                    });</script>`;
            }
            //时间选择器
            if (["start-date", "end-date", "date"].includes(item.id)) {
                content += ` class="layui-input layui-input-inline ${item.id}">
                <i class="layui-icon layui-icon-time" onclick="${"$('#" + item.id + "').click()"}"></i>`;
                let date_type = item.hasOwnProperty('date_type') ? item.date_type : 'date';
                let today = (new Date()).toLocaleDateString();
                today = today.replace(/\//g, '-');
                const param = {}
                item.hasOwnProperty('min') ? param.min = item.min : null;
                item.hasOwnProperty('max') ? param.max = item.max : null;
                content += buildDateObj(item.id, date_type, today, param);
            } else {
                content += ` class="layui-input layui-input-inline">`;
            }
        } else if (item.type == 'select') {
            content += `<div class="layui-input-inline"><select name="${item.name}" lay-filter="${item.name}" id="${item.name}" class="layui-input">`;
            if (item.hasOwnProperty('default')) {
                content += `<option value="${item.default[0]}">${item.default[1]}</option>`;
            } else {
                content += item.hasOwnProperty('notDefault') && item.notDefault ? '' : '<option value="">请选择</option>';
            }

            let selectData = typeof item.data == 'string' ? JSON.parse(item.data) : item.data;
            if (Array.isArray(selectData)) {
                selectData = selectData.reduce((data, item, index) => {
                    data[index] = item;
                    return data;
                }, {});
            }
            Object.keys(selectData).forEach(key => {
                let selected = item.selected == key ? `selected="selected"` : '';
                content += `<option value="${key}" ${selected}>${selectData[key]}</option>`;
            });

            content += `</select></div>`;
        } else if (item.type == "radio") {
            content += `<span class="data-screening-title">${item.label}</span>`;
            Object.keys(item.value).forEach(key => {
                let checked = item.checked == item.value[key] ? `checked="checked"` : '';
                content += `<input type="radio" name="${item.name}" title="${item.title[key]}" value="${item.value[key]}" ${checked}>`;
            })
        }
        content += `</div>`;
    });

    const btn = extra.btn ? extra.btn : [{"class": "layui-btn-normal", "title": "搜索"}];
    content += `<div class="layui-inline">`;
    Object.values(btn).forEach(value => {
        let btnEvent = value.hasOwnProperty('btnEvent') ? value.btnEvent : null;
        onSubmit = btnEvent && value.hasOwnProperty('preventDefault') ? btnEvent : null;
        content += `<button class="layui-btn ${value.class}">${value.title}</button>`;
    });
    /*<button class="layui-btn layui-btn-primary">重置</button>*/
    content += `</div>`;

    //右浮动按钮组（一般用于：导出、导入等功能）
    if (extra.right) {
        content += `<div class="layui-inline" style="float: right;">`;
        Object.values(extra.right).forEach(item => {
            let btnEvent = item.hasOwnProperty('btnEvent') ? item.btnEvent : null;
            switch (item.type) {
                case 'input':
                    content += `<input class="layui-btn layui-btn-normal"`;
                    Object.keys(item).forEach(key => {
                        content += `${key}="${item[key]}" `;
                    });
                    content += `>`;
                    break;
                case 'button':
                    content += `<button type="button" class="layui-btn layui-btn-primary" onclick="${btnEvent}">
                    ${item.label}
                    </button>`;
                    break;
                default:
                    break;
            }
        });

        content += `</form></div>`;
    }
    layui.use("form", function () {
        var form = layui.form;
        form.render();
    });

    form_head = onSubmit ? `<form action="" class="layui-form search-form" onsubmit="return ${onSubmit}">` : form_head;
    return form_head + content;
}

/**
 * 生成layui弹窗 “提示”框
 * @param content html内容
 * @param params 额外参数，如：标题，skin
 */
layui_tips = (content, params = {}) => {
    layer.open({
        type: 1,
        title: params.title ? params.title : false,
        skin: 'layui-layer-tips',
        closeBtn: 1,
        anim: 2,
        shadeClose: true,
        content
    });
}

/**
 * 生成layui“确认删除”框(适合简单单表删除)
 * @param url 链接
 * @param table 要删除ID对应的表
 * @param data 要删除的ID
 */
layui_del = (url, table, data = {}) => {
    layer.confirm('你确定要删除吗？', {
        btn: ['确定', '取消'] //按钮
    }, function () {
        $.post(url, data, function (res) {
            layer.msg(res.msg, {icon: res.code}, function () {
                location.reload();
            });
        });
    }, function () {
        layer.close();
    });
}

//分页
layui_page = (count = 1, limit = 10, curr = 1) => {
    // 日期
    layui.use('laydate', function () {
        let laydate = layui.laydate;
        laydate.render({
            elem: '#laydate' //指定元素
        });
    });
    // 分页
    layui.use(['laypage'], function () {
        let laypage = layui.laypage;
        laypage.render({
            elem: 'laypage'
            , count
            , limit
            , curr
            , jump: function (obj, first) {
                //首次不执行
                if (!first) {
                    let params = window.location.search;
                    let page = 'page=' + obj.curr;
                    let url = window.location.pathname;
                    let last_url = '';
                    if (params == '') {
                        last_url = url + '?' + page;
                    } else {
                        last_url = url + params + '&' + page;
                        if (params.indexOf('page=') != -1) {
                            let one = params.split('page=');
                            last_url = url + one[0] + page;
                        }
                    }
                    location.href = last_url;
                }
            }
            , theme: '#1E9FFF'
        });
    });
}

/**
 * 生成hplus弹窗“编辑”框
 * @param json 内容，二维数组
 * @param title 弹窗标题
 * @param area 指定列宽，一维数组
 * @param params 额外配置项
 */
hplus_edit = (json, title, area, params) => {
    let id = params.hasOwnProperty('id') ? params.id : 'form-create';
    let content = `
    <div class="ibox">
        <div class="ibox-content">
            <form role="form" for="${id}"  id="${id}" method="post" class="form-horizontal">
    `;

    Object.values(json).forEach(item => {
        //隐藏域
        if (item.type == 'hidden') {
            content += `<input type="hidden" name="${item.name}" value="${item.value}">`;
            return true;
        }

        let col = params.hasOwnProperty('col') ? params.col : [2, 10];
        let label_style = item.hasOwnProperty('label_style') ? item.label_style : '';
        let star = item.hasOwnProperty('required') && item.required ? '<span class="c-red">*</span>' : '';//必选项 label标题
        content += `
        <div class="form-group" style="display:flex">
            <label class="col-md-${col[0]} control-label" style="${label_style}">${star} ${item.label}：</label>
            <div class="col-md-${col[1]} content">`;

        //input框
        if (['text', 'number', 'password'].includes(item.type)) {
            content += `<input type="${item.type}" class="form-control" `;
            Object.keys(item).forEach(key => {
                content += key + `="${item[key]}" `;
            });
            content += `>`;
        }

        //自定义内容，如：标题，上传图片等等
        if (item.type == 'content') {
            let style = item.hasOwnProperty('style') ? `style="${item.style}"` : null;
            content += `<div class="input-label" ${style}>${item.data}</div>`;
        }

        //下拉框
        if (item.type == 'select') {
            //判断是否是数组，是，则内嵌栅格化，否则直接显示
            let isArray = Array.isArray(item.data);
            //单个select对象转数组
            const selectData = !isArray ? [item] : item.data;
            if (isArray) {
                content += `<div class="select-list">`;
            }
            for (let i = 0; i < selectData.length; i++) {
                let vo = selectData[i];
                isArray ? content += `<div class="form-group">` : null;
                isArray && vo.hasOwnProperty('label') ? content += `<span>${vo.label}：</span>` : null;
                let disabled = vo.hasOwnProperty('disabled') ? 'disabled' : ''; //只读
                let classObj = vo.hasOwnProperty('class') ? vo.class : '';
                content += `<select name="${vo.name}" class="form-control ${classObj}" id="${vo.name}">`;
                if (vo.hasOwnProperty('default')) {   // 默认：下拉框选项
                    content += `<option value="${vo.default[0]}">${vo.default[1]}</option>`;
                } else {
                    content += vo.hasOwnProperty('notDefault') && vo.notDefault ? '' : '<option value="">请选择</option>';
                }
                //循环data，将data中的json数据循环输出
                if (vo.hasOwnProperty('data')) {
                    Object.keys(vo.data).forEach(key => {
                        let selected = vo.selected == key ? `selected="selected"` : ''; // 默认selected选中的值
                        content += `<option value="${key}" ${disabled} ${selected}>${vo.data[key]}</option>`;
                    });
                }
                content += `</select>`;
                isArray ? content += `</div>` : null;
            }
            isArray ? content += '</div>' : null;
        }
        content += `
            </div>
        </div>
        <div class="hr-line-dashed"></div>
        `;
    });

    //自定义按钮配置
    content += `<div class="form-group"><div class="col-sm-10 col-sm-offset-2 btnArr">`;
    const btn = params.hasOwnProperty('btn') ? params.btn : [];
    if (btn.length >= 1) {
        for (let i = 0; i < btn.length; i++) {
            let btnObj = btn[i];
            let btnClass = btnObj.hasOwnProperty('class') ? `class="${btnObj.class}"` : 'class="btn"';
            let btnName = btnObj.name;
            let bindEvent = btnObj.hasOwnProperty('bindEvent') ? `onclick="${btnObj.bindEvent}"` : '';
            btnObj.hasOwnProperty('class') ? delete btnObj.class : null;
            btnObj.hasOwnProperty('bindEvent') ? delete btnObj.bindEvent : null;
            btnObj.hasOwnProperty('name') ? delete btnObj.name : null;
            content += `<button type="button" ${btnClass} ${bindEvent}`;
            Object.keys(btnObj).forEach(key => {
                content += ` ${key}="${btnObj[key]}" `;
            });
            content += `>${btnName}</button>`;
        }
    } else {
        //默认按钮
        content += `
            <button for="form-create" class="btn btn-primary" type="submit">提交</button>
            <button class="btn btn-white" type="button" onclick="location.reload()">重置</button>
        `;
    }
    content += `</div></div>`;

    //自定义监听事件
    if (params.hasOwnProperty('bindEvent')) {
        window[params.bindEvent].call();
    }

    //自定义样式
    content += `<style>`;
    //通用样式
    content += `
    .c-red{color: red;}
    .ibox{margin: 0;clear: both;}
    .btnArr button{margin-right: 10px;}
    .content{margin:auto 0;}
    .select-list{display:flex;flex-wrap:wrap;}
    .select-list .form-group{display: flex;}
    .select-list .form-group select{float: left;}
    .select-list .form-group:not(:first-child){margin-left: 20px;}
    .select-list .form-group span{white-space: nowrap;margin: auto 0;}
    `;
    //自定义标签宽度
    if (params.hasOwnProperty('label_width')) {
        content += `
        .control-label {width: ${params.label_width}!important;float: left;text-align: right;}
        .content {width: calc(100% - ${params.label_width}px)!important;float: left;}
        `;
    }

    content += `</style>`;
    content += `
                </form>
        </div>
    </div>
    `;

    return content;
}

//省市区三级联动
areaListen = (url, id_el, pid) => {
    //三级联动
    const getIndex = ((arr, item) => {
        for (let i in arr) {
            if (arr[i] == item) {
                return i;
            }
        }
    });
    const el_arr = ['province_id', 'city_id', 'area_id', 'town_id'];
    let index = getIndex(el_arr, id_el);//当前节点下标
    let next_index_el = el_arr[parseInt(index) + 1];
    if (next_index_el != "undefined") {
        //三级联动
        if (next_index_el == 'city_id') {
            $("#city_id").html('').append("<option>请选择</option>");
            $("#area_id").html('').append("<option>请选择</option>");
            $("#town_id").html('').append("<option>请选择</option>");
        } else if (next_index_el == 'area_id') {
            $("#area_id").html('').append("<option>请选择</option>");
            $("#town_id").html('').append("<option>请选择</option>");
        }

        areaIdToString(el_arr, "project_area");//更新省市区镇的中文地址

        sendajax(url, pid, next_index_el, 0);
    }
};

//获取“省市区镇”拼接字符串
areaIdToString = (el_arr, area_el) => {
    let areaString = '';
    let strname;
    Object.values(el_arr).forEach(el => {
        strname = $("#" + el + " option:selected").html();
        if (typeof (strname) != 'undefined' && (strname != '--' || strname != '请选择')) {
            areaString += strname;
        }
    });
    $("[name=" + area_el + "]").val(areaString);
}

//生成URL
buildURL = (url, params) => {
    let param = '';
    Object.keys(params).forEach(key => {
        params[key] ? param += key + '=' + params[key] + '&' : null;
    });
    param = param.replace(/(\s|&)+$/g, '');
    console.log('lintong:');
    console.log(url);
    console.log(param ? url + '?' + param : url);
    return param ? url + '?' + param : url;
}

//获取事件冒泡路径，兼容ie11,edge,chrome,firefox,safari
eventPath = e => {
    const path = (e.composedPath && e.composedPath()) || e.path,
        target = e.target;

    if (path != null) {
        return (path.indexOf(window) < 0) ? path.concat(window) : path;
    }

    if (target === window) {
        return [window];
    }

    getParents = (node, memo) => {
        memo = memo || [];
        const parentNode = node.parentNode;

        if (!parentNode) {
            return memo;
        } else {
            return getParents(parentNode, memo.concat(parentNode));
        }
    }

    return [target].concat(getParents(target), window);
}

/**
 * 对象反转
 * @param object
 * @returns {{}}
 */
reverseObject = object => {
    let newObject = {};
    let keys = [];
    for (let key in object) {
        keys.push(key);
    }
    for (let i = keys.length - 1; i >= 0; i--) {
        let value = object[keys[i]];
        newObject[keys[i]] = value;
    }
    return newObject;
}

/**
 * 根据指定个数获取天数
 * @param day 指定天数，默认：7个（最近一周）
 * @param timestamp 指定时间戳
 * @param withToday 是否包含当天的日期
 * @param limit 决定该当前日期是起始或结束日期
 * @param sort 获取日期的顺序，end：表示当前日期为最后一天（如：["9-17", "9-16", "9-15"]）。start：表示当前日期为第一天（如：["9-15", "9-16", "9-17"]）
 * @param params 额外参数，如：日期格式...
 * @returns {any}
 */
getTimeByDays = (day = 7, timestamp = null, withToday = true, limit = 'end', sort = 'desc', params = {}) => {
    let myDate = timestamp ? new Date(timestamp * 1000) : new Date();
    let joiner = params.hasOwnProperty('joiner') ? params.joiner : '-'; //自定义连接符，默认：-
    let num;
    if (limit == 'end') {
        num = withToday ? day - 1 : day;
        myDate.setDate(myDate.getDate() - num);
    } else if (limit == 'start') {
        num = withToday ? 0 : 1;
        myDate.setDate(myDate.getDate() + num);
    }

    let dateArray = [];
    let dateTemp;
    let gap = 1;
    for (let i = 0; i < day; i++) {
        let head_str = params.hasOwnProperty('withYear') && params.withYear ? myDate.getFullYear() + joiner : '';
        dateTemp = head_str + (myDate.getMonth() + 1) + joiner + myDate.getDate();
        dateArray.push(dateTemp);
        myDate.setDate(myDate.getDate() + gap);
    }
    return sort == 'desc' ? dateArray.reverse() : dateArray;
}

/**
 * 生成指定当前往前指定个数的时间段的时分
 * @param count 生成多少个时分，默认：36个
 * @param gap 时间间隔，单位：秒。默认：5分钟，即300秒
 * @param timestamp 指定时间戳生成
 * @returns {{data: *[], time: string}}
 */
getMinutesGap = (count = 36, gap = 300, timestamp = null) => {
    let myDate = timestamp ? new Date(timestamp * 1000) : new Date();
    let currentTime = formatDate2Time(myDate);
    let currentMinutesTime = formatTime2Date(currentTime, ['y', 'm', 'd', 'h', 'i']);
    let time = formatDate2Time(currentMinutesTime);
    let dateArray = [];
    for (let i = 0; i < count; i++) {  // i 代表往前推多少个时间点(结果数组长度)
        dateArray.push(addZero(myDate.getHours()) + ':' + addZero(myDate.getMinutes())); // 时分
        myDate.setSeconds(myDate.getSeconds() - gap);
    }
    return {time, 'data': dateArray.reverse()};
}

//从1970年开始的毫秒数然后截取10位变成 从1970年开始的秒数
formatDate2Time = date => {
    let tmp = Date.parse(date).toString();
    return tmp.substr(0, 10);
}

//格式化时间
formatTime2Date = (time, formate = ['y', 'm', 'd', 'h', 'i', 's']) => {
    let date = new Date(time * 1000);
    let arr1 = [];
    formate.includes('y') ? arr1.push(date.getFullYear()) : null;
    formate.includes('m') ? arr1.push(addZero(date.getMonth() + 1)) : null;
    formate.includes('d') ? arr1.push(addZero(date.getDate())) : null;
    let arr2 = [];
    formate.includes('h') ? arr2.push(addZero(date.getHours())) : null;
    formate.includes('i') ? arr2.push(addZero(date.getMinutes())) : null;
    formate.includes('s') ? arr2.push(addZero(date.getSeconds())) : null;

    let datetime = arr1.join('-') + ' ' + arr2.join(':');
    return datetime.trim();
}

//获取日期区间相隔多少个月份（含开始，结束当月）
getMonthCount = (start_at, end_at, num = 2) => {
    let start = new Date(start_at);
    let end = new Date(end_at);

    let start_year = start.getFullYear();
    let end_year = end.getFullYear();
    let start_month = start.getMonth() + 1;
    let end_month = end.getMonth() + 1;

    const msg = [
        "开始、结束日期不能为空",
        "日期区间有误，只允许查询相邻两个月数据",
        "结束日期必须大于开始日期"
    ];
    let count, code;
    if (!start_at && !end_at) {
        return false;
    } else if ((start_at && !end_at) || (!start_at && end_at)) {
        return msg[0];
    }

    if (start_year == end_year) {
        start_month + num - 1 < end_month ? code = 1 : null;
        end_month - start_month < 0 ? code = 2 : null;
        count = end_month - start_month + 1;
    } else {
        start_month + num - 1 < ((end_year - start_year) * 12 + end_month) ? code = 1 : null;
        end_year - start_year < 0 ? code = 2 : null;
        count = ((end_year - start_year) * 12 + end_month) - start_month + 1;
    }

    return code ? msg[code] : count;
};

//数字补0操作（补位）
addZero = num => {
    return parseInt(num) < 10 ? '0' + num : num;
}

//跳转到后台iFrame子页面
target_iFrame = (url, title, index, module = "ceoadmin") => {
    //iFrame闪存 要跳转的页面
    localStorage.setItem('iFrame_target', url);
    localStorage.setItem('iFrame_title', title);
    localStorage.setItem('iFrame_index', index);
    location.href = `/index/index`;
    return false;
}

/**
 * 通过参数名获取url中的参数值
 * @param queryName 参数名
 * @returns {string|null} 参数值
 * @constructor
 */
getQueryValue = queryName => {
    let query = decodeURI(window.location.search.substring(1));
    let strs = query.split("&");
    for (let i = 0; i < strs.length; i++) {
        let pair = strs[i].split("=");
        if (pair[0] == queryName) {
            return pair[1];
        }
    }
    return null;
}

//同步获取异步数据
async function getAjaxJsonByAsync(url, param = {}, type = 'get') {
    let result;
    switch (type) {
        case "post":
            result = await $.post(url, param);
            break;
        case "json":
            result = await $.getJSON(url, param);
            break;
        case "jsonp":
            result = await $.getJSONP(url, param);
            break;
        case "get":
            result = await $.get(url, param);
        default:
            break;
    }
    return result;
}

