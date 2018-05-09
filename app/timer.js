define(function (require, exports, module) {
    function t(options){
        this.project=options.issue;
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
    Timer.prototype.register=function(options){
//        crete new timer
        Timer.timers[options.issue]= new t(options);
        return Timer.timers[options.issue];
    };
    Timer.prototype.hasTimer=function(issue){
        if(!!Timer.timers[issue]) return true;
        return false;
    };
    Timer.prototype.getTimer=function(issue){
        return Timer.timers[issue];
    }
    var timer= new Timer();
    module.exports=timer;
});
