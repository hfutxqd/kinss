$(function () {
    // 立刻刷新rss
    $("i.fa-refresh").click(function () {
        $.getJSON("/api/refresh", function (result) {
            if (result['state'] === 'success') {
                alert("正在抓取，请在几秒后刷新。");
            };
        });
    });

    // 监听每个feed的点击
    $('#navbar').on('click', 'li', function () {
        // 修改标题
        $('title').html($(this).contents().filter(function (index, content) {
            return content.nodeType === 3;
        }).text());

        show_article_list(this);
        scroll_to_end($("#page-wrapper"), 'top');
        // 删除文章操作按钮
        $("i.article").css("display", "none");
        // 阻止冒泡
        if ($(this).attr('class').indexOf("each-feed") != -1) {
            return false;
        };
    });

    //监听每篇文章
    $('#page-content').on('click', 'li', function () {
        show_article_content($(this).attr('entry_id'));
    });

    // 监听二维码按钮
    $('i.fa-qrcode').on('click', function () {
        $("#qrcode-wrapper").toggle();
    });

    //监听翻页按钮的点击
    $('i.nav-btn-up').on('click', function () {
        scroll_content($("#navbar"), 'up');
    });
    $('i.nav-btn-down').on('click', function () {
        scroll_content($("#navbar"), 'down');
    });
    $('i.page-btn-down').on('click', function () {
        scroll_content($("#page-wrapper"), 'down');
    });
    $('i.page-btn-up').on('click', function () {
        scroll_content($("#page-wrapper"), 'up');
    });
    $('i.top-btn').on('click', function () {
        scroll_to_end($("#page-wrapper"), 'top');
    });
    $('i.end-btn').on('click', function () {
        scroll_to_end($("#page-wrapper"), 'end');
    });
    $('i.next-btn').on('click', function () {
        show_article_content("next");
    });

    // 监听动作操作
    $("i.article.read,i.article.star").on('click', function () {
        change_state(this);
    });

    $("#navbtn").click(function () {
        $(this).toggleClass("fa-rotate-90");
        $("#navbar").toggle();
    });

    if (location.pathname === "/article") {
        $.ajaxSettings.async = false;
        $.getJSON("/api/get-categories", function (result) {
            var html = "";
            for (var i in result) {
                html += '<li class="category" category_id="' + result[i]['id'] + '"> <i class="fa-li fa fa-folder-o fa-fw"></i>' + result[i]['title'] + '<ul class="fa-ul"></ul></li>';
            };
            $("#folders").html(html)
        });

        $.getJSON("/api/get-feeds", function (result) {
            for (var i in result) {
                var selector = "[category_id=" + result[i].category.id + "] ul";
                var html = '<li class="each-feed" feed_id="' + result[i]['id'] + '"> <i class="fa-li fa fa-rss fa-fw"></i>' + result[i]['title'] + '</li>';
                html += $(selector).html();
                $(selector).html(html);
            };
        });

        $.ajaxSettings.async = true;

        $("li.unread.btn").click();
    } else { };

});


function show_article_list(obj) {
    var flag = true;
    if ($(obj).attr('class').indexOf("btn") != -1) { //上面四个大类
        var url = $(obj).attr('eachurl')
    } else if ($(obj).attr('class').indexOf("each-feed") != -1) { //每个Feed源
        var url = "/api/article-list?type=each&feed_id=" + $(obj).attr('feed_id');
    } else if ($(obj).attr('class').indexOf("category") != -1) { //分类
        // 显示与隐藏feeds
        if ($(obj).find(".each-feed").css("display") == "none") {
            $(obj).find(".each-feed").css("display", "block")
        } else {
            $(obj).find(".each-feed").css("display", "none")
        };
        flag = false;
        var url = "/api/article-list?type=category&category_id=" + $(obj).attr('category_id');
    };

    $.getJSON(url, function (result) {
        if (result['state'] === 'success') {
            var html = '<ul>';
            for (var i in result["data"]["entries"]) {
                var li = '<li entry_id="' + result["data"]["entries"][i]["id"] + '">\
                <p class="feed-title">' + result["data"]["entries"][i]["feed"]["title"] + '</p>\
                <p class="article-title">' + result["data"]["entries"][i]["title"] + '</p>\
                </li>';
                html += li;
            }
            html += "</ul>"
            $("#page-content").html(html);
        };
    });

    if (flag) {
        $("#navbtn").click();
    };
}


function show_article_content(id) {
    var url = "/api/article?entry_id=" + id;
    $.getJSON(url, function (result) {
        if (result['state'] === 'success') {
            $("#page-content").html(result['data']['content']);
            $("#page-content").attr("entry_id", result['data']['id']);
            $('title').html(result['data']['title']);

            // 设置二维码
            var link = result['data']['url']
            var src = "/api/get-qrcode?content=" + encodeURIComponent(link);
            $("#qrcode").attr("src", src);

            change_icon(result['data']);
            //点进来就算已读
            if ($("i.article.read").hasClass("fa-square-o")) {
                $("i.article.read").click();
            }

            $("i.article").css("display", "");
        } else if (result['state'] === 'error') {
            alert(result['info']);
        };
    });
}

function scroll_content(obj, direction) {
    var t = 500;
    var pos = $(obj).scrollTop();
    if (direction === 'up') {
        $(obj).scrollTop(pos - t);
    } else if (direction === 'down') {
        $(obj).scrollTop(pos + t);
    };
}

function scroll_to_end(obj, direction) {
    if (direction === 'top') {
        $(obj).scrollTop(0);
    } else if (direction === 'end') {
        $(obj).scrollTop($(obj)[0].scrollHeight);
    };
}

function change_state(obj) {
    var url = "/api/action?entry_id=" + $("#page-content").attr("entry_id");

    if ($(obj).hasClass("star")) {
        if ($(obj).hasClass("fa-star-o")) { //没加星的
            url = url + "&action=is_star&type=1";
        } else {
            url = url + "&action=is_star&type=0";
        }
    } else if ($(obj).hasClass("read")) {
        if ($(obj).hasClass("fa-square-o")) { //未读的
            url = url + "&action=is_read&type=1";
        } else {
            url = url + "&action=is_read&type=0";
        }
    };

    $.getJSON(url, function (result) {
        if (result['state'] === 'success') {
            change_icon(result['data']);
        };
    });

}

function change_icon(data_obj) {
    if (data_obj['starred']) {
        $("i.article.star").removeClass("fa-star-o").addClass('fa-star');
    } else {
        $("i.article.star").removeClass("fa-star").addClass('fa-star-o');
    };

    if (data_obj['status'] === "read") {
        $("i.article.read").removeClass("fa-square-o").addClass('fa-check-square-o');
    } else {
        $("i.article.read").removeClass("fa-check-square-o").addClass('fa-square-o');
    };
}