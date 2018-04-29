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
    var workspaceManager=brackets.getModule("view/WorkspaceManager");
    var jiraPanelTemplate=require("text!htmlContent/jiraPanelTemplate.html");
    var configData=require("text!config/config.json");
    var config=JSON.parse(configData);

    function Jira(){

    }
    Jira.project="";
    Jira.assignee="";
    Jira.panel=null;
    Jira.$panel=null;
    Jira.panelElement=null;
    Jira.prototype.init=function(){
        Jira.getProjects(Jira.showPanel);
    }
    Jira.getProjects=function(callback){
        $.ajax({
            url:config.url+ config.api.all_projects,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json"
            },
            success:function(r){
                console.log(r);
                callback(r);
            },
            error:function(r){
                alert("error");
            }
        });
    }
    Jira.getTickets=function(callback){
        var jql="project = "+Jira.project;
        if(!!Jira.assignee) jql+=" and assignee = "+ Jira.assignee;
        $.ajax({
            url:config.url+ config.api.tickets,
            headers:{
                "Authorization":"Basic "+btoa(config.username+ ":"+ config.token),
                "Accept":"application/json",
                "Content-type":"application/json"
            },
            data:{
                "jql": jql,
                "startAt": 0,
                "maxResults": 15,
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
                alert("error");
            }
        });
    }
    Jira.showTickets=function(data){
        var t=data.issues;
        var h="<tr><th>Key</th><th>Summary</th><th>Assignee</th><th>Created By</th><th>Date</th><th>Type</th><th>Priority</th><th>Reporter</th><th>Status</th></tr>";
        for(var i=0;i<t.length;i++){
            h+="<tr>";
            h+="<td>"+ t[i].key+ "</td>"
                +"<td>"+ t[i].fields.summary+ "</td>"
                +"<td>"+ t[i].fields.assignee.name+ "</td>"
                +"<td>"+ t[i].fields.creator.name+ "</td>"
                +"<td>"+ t[i].fields.created+ "</td>"
                +"<td class='"+ t[i].fields.issuetype.name.toLowerCase() +"'>"+ t[i].fields.issuetype.name+ "</td>"
                +"<td>"+ t[i].fields.priority.name+ "</td>"
                +"<td>"+ t[i].fields.reporter.name+ "</td>"
                +"<td>"+ t[i].fields.status.name+ "</td>";
            h+="</tr>";
        }
        var jiraTable=Jira.$panel.find("#jira_table");
        jiraTable.empty().append(h);
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
        Jira.panel=workspaceManager.createBottomPanel("jira",$(panelHtml),200);
        Jira.$panel=Jira.panel.$panel;
        $(".jira-close").click(function(){
            Jira.$panel.hide();
        });
        $("#jira_get_list").click(function(){
            Jira.project=$("#jira_project").val();
            Jira.assignee=$("#jira_assignee").val();
            Jira.getTickets(Jira.showTickets);
        });
        Jira.$panel.show();
    }
    var jira=new Jira();
    module.exports = jira;
});
