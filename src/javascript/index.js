console.log('hello  饥人谷sss')
import './icons.js'
import Swiper from './swiper.js'


class Player {
    constructor(node) {
        this.root = typeof node === 'string' ? document.querySelector(node) : node
        this.$ = selector => this.root.querySelector(selector)
        this.$$ = selector => this.root.querySelectorAll(selector)
        this.songList = []
        this.currentIndex = 0     //用于计算上一曲，下一曲的循环
        this.audio = new Audio()
        this.lyricsArr = []
        this.lyricIndex = -1

        this.start()
        this.bind()
    }

    start() {
        fetch('https://jirengu.github.io/data-mock/huawei-music/music-list.json')
            .then(res => res.json())
            .then(data => {
                console.log(data)
                this.songList = data
                this.loadSong()
            })
    }
    bind() {
        let self = this
        this.$('.btn-play-pause').onclick = function () {
            console.log(self.audio)
            if (this.classList.contains('playing')) {
                self.audio.pause()
                this.classList.remove('playing')
                this.classList.add('pause')
                this.querySelector('use').setAttribute('xlink:href', '#icon-play')
            } else if (this.classList.contains('pause')) {
                self.audio.play()
                this.classList.remove('pause')
                this.classList.add('playing')
                this.querySelector('use').setAttribute('xlink:href', '#icon-pause')
            }
        }

        this.$('.btn-pre').onclick = function () {
            self.currentIndex = (self.songList.length + self.currentIndex - 1) % self.songList.length
            self.loadSong()
            self.playSong()
            if (self.$('.btn-play-pause').classList.contains('pause')) {
                self.$('.btn-play-pause').classList.remove('pause')
                self.$('.btn-play-pause').classList.add('playing')
                self.$('.btn-play-pause').querySelector('use').setAttribute('xlink:href', '#icon-pause')
            }
        }
        this.$('.btn-next').onclick = function () {
            self.currentIndex = (self.currentIndex + 1) % self.songList.length
            self.loadSong()
            self.playSong()
            if (self.$('.btn-play-pause').classList.contains('pause')) {
                self.$('.btn-play-pause').classList.remove('pause')
                self.$('.btn-play-pause').classList.add('playing')
                self.$('.btn-play-pause').querySelector('use').setAttribute('xlink:href', '#icon-pause')
            }
        }
        //播放时候时刻触发的方法
        this.audio.ontimeupdate = function () {
            //console.log(parseInt(self.audio.currentTime*1000))
            self.locateLyric() //定位歌词
            self.setProgressBar()

        }
        //页面切换
        let swiper = new Swiper(this.$('.panels'))
        swiper.on('swipLeft', function () {
            this.classList.remove('panel1')
            this.classList.add('panel2')
            console.log('left')
        })
        swiper.on('swipRight', function () {
            this.classList.remove('panel2')
            this.classList.add('panel1')
            console.log('right')
        })
    }
    //加载歌曲信息，歌曲标题、作者、时间
    loadSong() {
        let songObj = this.songList[this.currentIndex]
        this.$('.header h1').innerText = songObj.title
        this.$('.header p').innerText = songObj.author + '-' + songObj.albumn
        this.audio.src = songObj.url
        this.audio.onloadedmetadata = () => this.$('.time-end').innerText = this.formateTime(this.audio.duration)

        //在音乐加载的时候获取(this.audio.duration)的总时长，用formateTime的方法转换成需要的格式
        this.loadLyrics()
    }

    playSong() {
        this.audio.oncanplaythrough = () => this.audio.play()
    }

    //加载歌词
    loadLyrics() {
        fetch(this.songList[this.currentIndex].lyric)
            .then(res => res.json())
            .then(data => {
                //console.log(data.lrc.lyric)
                this.setLyrics(data.lrc.lyric)
                //console.log(this.lyricsArr)
                window.lyrics = data.lrc.lyric
            })
    }
    //定位歌词
    locateLyric() {
        console.log('locateLyric')
        let currentTime = this.audio.currentTime * 1000  //播放时间变成毫秒数，像368
        let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0]  //当前数组[['123','歌词'],['234','歌词'],['456','歌词']]
        //如果当前时间大于数组歌词的时间且吧歌词不是最后一句，展示歌词。
        if (currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
            this.lyricIndex++
            let node = this.$('[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]') //找出对应时间的歌词
            if (node) this.setLineToCenter(node)  //让歌词展示到中间
            this.$$('.panel-effect .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
            this.$$('.panel-effect .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''
        }
    }
    //歌词的处理原始歌词为（[00:19.33]着迷于你眼睛 银河有迹可循）
    setLyrics(lyrics) {
        this.lyricIndex = 0
        let fragment = document.createDocumentFragment()
        let lyricsArr = []
        this.lyricsArr = lyricsArr
        lyrics.split(/\n/)
            .filter(str => str.match(/\[.+?\]/))
            .forEach(line => {
                let str = line.replace(/\[.+?\]/g, '')
                line.match(/\[.+?\]/g).forEach(t => {
                    t = t.replace(/[\[\]]/g, '')
                    let milliseconds = parseInt(t.slice(0, 2)) * 60 * 1000 + parseInt(t.slice(3, 5)) * 1000 + parseInt(t.slice(6))
                    lyricsArr.push([milliseconds, str]) //['毫秒数', '歌词']
                })
            })
        //把歌词按时间大小排序
        lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
            if (v1[0] > v2[0]) {
                return 1
            } else {
                return -1
            }
        }).forEach(line => {
            let node = document.createElement('p')
            node.setAttribute('data-time', line[0])
            node.innerText = line[1]
            fragment.appendChild(node)  //处理后格式<p data-time="1031">监制：郭顶</p>
        })
        this.$('.panel-lyrics .container').innerHTML = ''
        this.$('.panel-lyrics .container').appendChild(fragment) 
    }
    //播放时歌词处于中间
    setLineToCenter(node) {
        //每个歌词要偏移的高度 = 歌词到最顶的高度 - 歌词容器一半的高度
        let translateY = node.offsetTop - this.$('.panel-lyrics').offsetHeight / 2
        //前面的歌词不需要滚动
        translateY = translateY > 0 ? translateY : 0
        this.$('.panel-lyrics .container').style.transform = `translateY(-${translateY}px)`
        this.$$('.panel-lyrics p').forEach(node => node.classList.remove('current'))
        node.classList.add('current')
    }

    setProgressBar() {
       // console.log('set setProgerssBar')
        let percent = (this.audio.currentTime * 100 / this.audio.duration) + '%'
       // console.log(percent)
        this.$('.bar .progress').style.width = percent
        this.$('.time-start').innerText = this.formateTime(this.audio.currentTime)
       // console.log(this.$('.bar .progress').style.width)
    }

    formateTime(secondsTotal) {
        let minutes = parseInt(secondsTotal / 60)
        minutes = minutes >= 10 ? '' + minutes : '0' + minutes
        let seconds = parseInt(secondsTotal % 60)
        seconds = seconds >= 10 ? '' + seconds : '0' + seconds
        return minutes + ':' + seconds
    }
}

window.p = new Player('#player')
