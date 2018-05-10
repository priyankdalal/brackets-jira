define(function (require, exports, module) {
    function t(id){
        this.id=id;
        var running=false;
        this.running=running;
        var timer=null;
        this.timer=timer;
        var time=0;
        this.time=time;
        this.start=function(){
            running=true;
            timer=setInterval(function(){
                time++;
                console.log(time);
            },1000);
        };
        this.stop=function(){
            clearInterval(timer);
            running=false;
        };
        this.reset=function(){
            clearInterval(timer);
            timer=0;
        };
    };
   function Timer(){}
    Timer.timers={};
    Timer.prototype.register=function(id){
//        crete new timer
        Timer.timers[id]= new t(id);
        return Timer.timers[id];
    };
    Timer.prototype.hasTimer=function(id){
        if(!!Timer.timers[id]) return true;
        return false;
    };
    Timer.prototype.getTimer=function(id){
        return Timer.timers[id];
    }
    Timer.prototype.saveState=function(id,t){
        Timer.timers[id]={};
        Timer.timers[id]=t;
    }
    Timer.prototype.getAllTimers=function(){
        return Timer.timers;
    };
    var timer= new Timer();
    module.exports=timer;
});
