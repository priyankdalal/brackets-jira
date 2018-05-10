define(function (require, exports, module) {
    function t(id){
        this.id=id;
        var timer=null;
        this.timer=timer;
        var time=0;
        this.time=time;
        this.start=function(){
            timer=setInterval(function(){
                time++;
                console.log(time);
            },1000);
        };
        this.stop=function(){
            clearInterval(timer);
        };
        this.restart=function(){
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
    var timer= new Timer();
    module.exports=timer;
});
