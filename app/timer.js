define(function (require, exports, module) {
    function Timer(){
        var that=this;
        that.running=false;
        that.time=0;
        this.start=function(){
            that.running=true;
            that.interval=setInterval(function(){
                that.time++;
                console.log(that.time);
            },1000);
        };
        this.stop=function(){
            clearInterval(that.interval);
            that.running=false;
        };
        this.reset=function(){
            clearInterval(that.interval);
            that.time=0;
        };
        this.isRunning=function(){
            return that.running;
        }
        this.getTime=function(){
            return that.time;
        }
        this.setTime=function(t){
            that.time=t;
        }
    };
    var timer= new Timer();
    function TimerManager(){}
    TimerManager.timers={};
    TimerManager.prototype.register=function(id){
    //        create new timer
        TimerManager.timers[id]= {
            id:id,
            time:0,
            running:false,
            start:function(){
                //debugger;
                timer.time=this.time;
                timer.start();
                this.running=true;
            },
            stop:function(){
                timer.stop();
                this.time=timer.time;
                this.running=false;
            },
            reset:function(){
                timer.stop();
                this.time=0;
                this.running=false;
            }
         };
        return TimerManager.timers[id];
    };
    TimerManager.prototype.hasTimer=function(id){
        if(!!TimerManager.timers[id]) return true;
        return false;
    };
    TimerManager.prototype.getTimer=function(id){
        return TimerManager.timers[id];
    }
    TimerManager.prototype.getAllTimers=function(){
        return TimerManager.timers;
    };
    var timerManager= new TimerManager();
    module.exports=timerManager;
});
