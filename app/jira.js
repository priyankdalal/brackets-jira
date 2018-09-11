/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {

    'use strict';
    var Dialogs= brackets.getModule("widgets/Dialogs");
    var jiraPagination= require("app/simplePagination");
    var jiraTimer= require("app/timer");
    var NodeDomain = brackets.getModule("utils/NodeDomain");
    var workspaceManager=brackets.getModule("view/WorkspaceManager");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var jiraPanelTemplate=require("text!htmlContent/jiraPanelTemplate.html");
    var CommentDialogTemplate=require("text!htmlContent/commentDialog.html");
    var CommentDialogMediaTemplate=require("text!htmlContent/commentDialogMediaTemplate.html");
    var transitionDialog=require("text!htmlContent/doTransitionDialog.html");
    var httpsDomain=new NodeDomain("httpsDomain",ExtensionUtils.getModulePath(module, "../node/httpsDomain"));
    var configData=require("text!config/config.json");
    var config=JSON.parse(configData);

    function Jira(){

    }
    Jira.project="";
    Jira.assignee="";
    Jira.panel=null;
    Jira.$panel=null;
    Jira.panelElement=null;
    Jira.sprint=null;
    Jira.issues=null;
    Jira.timer={};
    Jira.prototype.init=function(){
        Jira.getProjects(Jira.showPanel);
    };
    Jira.getProjects=function(callback){
        $.ajax({
            url:config.url+ config.api.all_projects,
            timeout:5000,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json"
            },
            success:function(r){
                console.log(r);
                callback(r);
            },
            error:function(r){
                alert("error: "+ r.status+ ",\nreason: "+ r.statusText);
                console.log(r);
            }
        });
    };
    Jira.showPanel=function(projects){
        var m_opt={
            project_options:function(){
                var h="";
                for(var i=0;i<projects.length;i++) h+="<option value='"+ projects[i].id+ "'>"+ projects[i].name+ "</option>";
                return h;
            }
        };
        var panelHtml=Mustache.render(jiraPanelTemplate,m_opt);
        if(!Jira.$panel){
            Jira.panel=workspaceManager.createBottomPanel("jira",$(panelHtml),200);
            Jira.$panel=Jira.panel.$panel;
            $(".jira-close").click(function(){
                Jira.panel.hide();
            });
            $("#jira_get_list").click(function(){
                Jira.$panel.find("#jira_table").empty().append("<tr><th>fetching data<span class='jira-loading'>.</span><span class='jira-loading'>.</span><span class='jira-loading'>.</span></th></tr>");
                Jira.project=$("#jira_project").val();
                Jira.assignee=$("#jira_assignee").val();
                Jira.getTickets(0,Jira.showTickets);
            });
        }
        Jira.panel.show();
    };
    Jira.getTickets=function(startAt=0,callback){
        Jira.$panel.find("#jira_table").empty().append("<tr><th>fetching data<span class='jira-loading'>.</span><span class='jira-loading'>.</span><span class='jira-loading'>.</span></th></tr>");
        $(".jira-option").prop("disabled",true);
        var jql="project = "+Jira.project;
        if(!!Jira.assignee) jql+=" and assignee = "+ Jira.assignee;
        $.ajax({
            url:config.url+ config.api.tickets,
            timeout:5000,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json",
                "Content-type":"application/json"
            },
            data:{
                "jql": jql,
                "startAt": startAt,
                "maxResults": 10,
                "fields": [
                    "summary",
                    "status",
                    "assignee"
                ],
                "fieldsByKeys": false
            },
            success:function(r){
                console.log(r);
                callback(r);
            },
            error:function(r){
                alert("error: "+ r.status+ ",\nreason: "+ r.statusText);
                console.log(r);
            }
        });
    };
    Jira.showTickets=function(data){
        var t=data.issues;
        Jira.issues=t;
        Jira.showTicketPagination(data.startAt,data.maxResults,data.total);
        var h="<tr><th>Tick</th><th>Key</th><th>Summary</th><th>Assignee</th><th>Created By</th><th>Date</th><th>Type</th><th>Priority</th><th>Reporter</th><th>Status</th></tr>";
        for(var i=0;i<t.length;i++){
            h+="<tr class='ticket' data-id='"+ t[i].id +"' data-seq='"+ i+ "'>";
            h+="<td><input type='checkbox' class='sprint-check' data-key='"+ t[i].key+ "' value='"+ t[i].id+ "' data-status='"+ t[i].fields.status.name+ "' /></td>"
                +"<td>"+ t[i].key+ "</td>"
                +"<td class='ticket-summary'>"+ t[i].fields.summary+ "</td>"
                +"<td>"+ t[i].fields.assignee.name+ "</td>"
                +"<td>"+ t[i].fields.creator.name+ "</td>"
                +"<td>"+ t[i].fields.created+ "</td>"
                +"<td class='"+ t[i].fields.issuetype.name.toLowerCase() +"'>"+ t[i].fields.issuetype.name+ "</td>"
                +"<td>"+ t[i].fields.priority.name+ "</td>"
                +"<td>"+ t[i].fields.reporter.name+ "</td>"
                +"<td class='sprint-status'>"+ t[i].fields.status.name+ "</td>";
            h+="</tr>";
        }
        if(t.length<1){
            h="No data to show.";
        }
        var jiraTable=Jira.$panel.find("#jira_table");
        jiraTable.empty().append(h);
        Jira.bindTableUI();
    };
    Jira.showTicketPagination=function(s,m,n){
        var currentPage=Math.ceil((parseInt(s)+1)/10);

        Jira.$panel.find("#pagination_container").pagination({
            items: parseInt(n),
            itemsOnPage: 10,
            currentPage:currentPage,
            cssStyle: 'compact-theme'
        }).slideDown();
        Jira.$panel.find("#pagination_container").find(".page-link").on("click",function(){
            Jira.$panel.find("#pagination_container").slideUp();
            var seq=$(this).attr("href").split("-")[1];
            seq=(parseInt(seq)-1)*10;
            Jira.getTickets(seq,Jira.showTickets);
        });
    };
    Jira.bindTableUI=function(){
        var jiraTable=Jira.$panel.find("#jira_table");
        jiraTable.find(".sprint-check").on("click",function(){
            $(".sprint-check").prop("checked",false);
            $(this).prop("checked",(!$(this).is(":checked")));
            Jira.sprint={id:$(this).val(),key:$(this).attr("data-key"),status:$(this).attr("data-status")};
            $(".jira-option").prop("disabled",false);
            if(!Jira.isObjectEmpty(Jira.timer)){
                if(Jira.timer.id!=Jira.sprint.key && Jira.timer.running){
                    $(".jira-log-time").prop("disabled",true);
                }else
                     $(".jira-log-time").prop("disabled",false);
            }
            $(".jira-log-time").off("click").on("click",function(){
                if(!Jira.isObjectEmpty(Jira.timer) && Jira.timer.id==Jira.sprint.key){
                    if($(this).attr("data-timer")=="off"){
                        Jira.timer.start();
                        $(this).attr({"data-timer":"on","title":"recording for "+Jira.sprint.key});
                        $(this).find("span").removeClass("glyphicon-time blue").addClass("glyphicon-record red record-animation");
                    }else{
                        Jira.timer.stop();
                        $(this).attr("data-timer","off");
                        $(this).find("span").removeClass("glyphicon-record red record-animation").addClass("glyphicon-time blue");
                    }
                }else{
                    if(jiraTimer.hasTimer(Jira.sprint.key))
                        Jira.timer=jiraTimer.getTimer(Jira.sprint.key);
                    else
                        Jira.timer=jiraTimer.register(Jira.sprint.key);
                    Jira.timer.start();
                    $(this).attr("data-timer","on");
                    $(this).find("span").removeClass("glyphicon-time blue").addClass("glyphicon-record red record-animation");
                }
            });
        });
        Jira.$panel.find("sprint-status").off("click").on("click",function(){

        });
        Jira.$panel.find(".jira-get-comment").off("click").on("click",function(){
            Jira.getComments(Jira.sprint,Jira.showCommentsDialog);
        });
        Jira.$panel.find(".jira-get-worklog").off("click").on("click",function(){
            Jira.getWorklog(Jira.sprint,Jira.showWorklog);
        });
        Jira.$panel.find(".jira-do-transition").off("click").on("click",function(){
            Jira.transition.getTransitionsForIssue(Jira.sprint,Jira.transition.showTransitionModal);
        });
        /*Jira.$panel.find(".jira-update-time").off("click").on("click",function(){

        });*/
        Jira.$panel.find(".ticket-summary").off("click").on("click",function(){
            var seq=$(this).parent().attr("data-seq");
            var h="<pre>"+ Jira.issues[parseInt(seq)].fields.description+ "</pre>";
            var dialog=Dialogs.showModalDialog("jira.description", "Description",h,[{ className: "btn btn-basic", id: "jira-des-ok", text: "Ok" }]);
        });
    };
    Jira.isObjectEmpty=function(obj){
        return JSON.stringify(obj)==JSON.stringify({});
    };
    Jira.getComments=function(sprint,callback){
        var url=config.url+ config.api.comments.replace("key",sprint.id);
        $.ajax({
            url:url,
            timeout:5000,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json"
            },
            success:function(res){
                console.log(res);
                callback(sprint,res);
            },
            error:function(res){
                alert("error: "+ res.status+ ",\nreason: "+ res.statusText);
                console.log(res);
            }
        });
    };
    Jira.showCommentsDialog=function(sprint,data){
        var cmntsHtml="";
        var cmnts=data.comments;
        if(cmnts.length>0){
            for(var i=0;i<cmnts.length;i++){
                cmnts[i].sprint_key=sprint.key;
                cmntsHtml+=Mustache.render(CommentDialogMediaTemplate,cmnts[i]);
            }
        }else cmntsHtml="<div class='well'>No comments till yet.</div>"
        console.log(cmntsHtml);
        var m_opt={
            comment:{
                DIALOG_TITLE:"Comments for "+sprint.key,
                COMMENT_HTML:cmntsHtml,
                CLOSE:"Close"
            }
        };
        var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(CommentDialogTemplate, m_opt));
        console.log(dialog._$dlg);
        dialog._$dlg.find(".dialog-add-comment").off("click").on("click",function(){
            var comment=dialog._$dlg.find(".jira-comment-input").val();
            var data={"body":comment};
            Jira.addComment(sprint,data);
        });

    };
    Jira.getWorklog=function(sprint,callback){
        var url=config.url+ config.api.getWorklog.replace("key",sprint.id);
        console.log(url);
        $.ajax({
            url:url,
            timeout:5000,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json"
            },
            timeout:5000,
            success:function(res){
                console.log(res);
                //callback(sprint,res);
            },
            error:function(res){
                console.log(res);
            }
        });
    };
    Jira.showWorklog=function(sprint,data){
        var cmntsHtml="";
        var cmnts=data.comments;
        if(cmnts.length>1){
            for(var i=0;i<cmnts.length;i++){
                cmntsHtml+=Mustache.render(CommentDialogMediaTemplate,cmnts[i]);
            }
        }else cmntsHtml="<div class='well'>No comments till yet.</div>"
        console.log(cmntsHtml);
        var m_opt={
            comment:{
                DIALOG_TITLE:"Comments for "+sprint.key,
                COMMENT_HTML:cmntsHtml,
                CLOSE:"Close"
            }
        };
        var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(CommentDialogTemplate, m_opt));

    };
    Jira.hidePanel=function(){
        if (Jira.panel && Jira.panel.isVisible()) {
            Jira.panel.hide();
            // Jira.panel.$panel.off(".bookmarks");
        }
    }
    Jira.addComment=function(sprint,data){
        //var url="reqres.in/api/users";
        var path=config.api.addComment.replace("key",sprint.id);
        var options={
            "body":data,
            "host":config.host,
            "path":path,
            "headers": {
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json",
                "Content-Type": "application/json; charset=utf-8",
            },
        };
        httpsDomain.exec("getHttps",options);
        httpsDomain.on("httpsresponse",function(ev,scope,message,data){
            console.log(ev);
            console.log(scope);
            console.log(message);
            console.log(data);
            if(data.hasOwnProperty("id"))
                alert("Comment submitted.");
            else
                alert("Failed to comment.");
        });
    };
    Jira.getHttpsResponse=function(data){
        console.log(data);
    };
    Jira.updataStatus=function(sprint,data){
        var options={
            "body":data,
            "host":config.host,
            "path":path,
            "headers": {
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json",
                "Content-Type": "application/json; charset=utf-8",
            },
        };
        httpsDomain.exec("getHttps",options);
        httpsDomain.on("httpsresponse",function(ev,scope,message,data){
            console.log(ev);
            console.log(scope);
            console.log(message);
            console.log(data);
            if(data.hasOwnProperty("id"))
                alert("Comment submitted.");
            else
                alert("Failed to comment.");
        });
    };
    Jira.transition={
        getTransitionsForIssue:function(sprint,callback){
            var url=config.url+ config.api.transition.getAvailableTransitions.replace("key",sprint.id);
            $.ajax({
                url:url,
                timeout:5000,
                headers:{
                    "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                    "Accept":"application/json"
                },
                success:function(res){
                    console.log(res);
                    callback(sprint,res);
                },
            });
        },
        showTransitionModal:function(sprint,data){
            console.log(sprint);
            var m_opt={
                DIALOG_TITLE:"Do transition for "+sprint.key,
                transitions:data.transitions,
                FROM:sprint.status,
                option:function(){
                    return "<option value='"+ this.id+ "'>"+ this.name+ "</option>";
                },
                CLOSE:"Close"
            };
            console.log(Mustache.render(transitionDialog, m_opt));
            var dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(transitionDialog, m_opt));
            dialog._$dlg.find(".dialog-do-transition").off("click").on("click",function(){
                var state=dialog._$dlg.find(".to-transtion").val();
                var data={"transition": {"id": state}};
                Jira.transition.do(sprint,data);
            });
        },
        do:function(sprint,data){
            var path=config.api.transition.doTransition.replace("key",sprint.key);
            var options={
                "body":data,
                "host":config.host,
                "path":path,
                "headers": {
                    "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                    "Accept":"application/json",
                    "Content-Type": "application/json; charset=utf-8",
                },
            };
            httpsDomain.exec("getHttps",options);
            httpsDomain.on("httpsresponse",function(ev,scope,message,data){
                console.log(ev);
                console.log(scope);
                console.log(message);
                console.log(data);
                if(data.hasOwnProperty("id"))
                    alert("Comment submitted.");
                else
                    alert("Failed to comment.");
            });
        }
    };

    var jira=new Jira();
    module.exports = jira;
});
