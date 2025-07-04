// 音频管理器
// 注意: 音乐播放功能已被禁用，仅支持音效播放
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.audioPools = new Map(); // 音频池
        this.activeAudioInstances = new Set(); // 活跃的音频实例
        this.sfxVolume = 0.8;
        this.muted = false;
        this.maxPoolSize = 3; // 每个音效最多保留3个实例
        this.cleanupInterval = null; // 清理定时器
        
        this.init();
    }
    
    init() {
        // 检查是否支持Web Audio API
        this.audioContext = null;
        
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported, falling back to HTML5 Audio');
        }
        
        // 从本地存储加载设置
        this.loadSettings();
        
        // 加载原游戏音效文件
        this.loadGameSounds();
        
        // 启动定期清理
        this.startCleanupTimer();
    }
    
    startCleanupTimer() {
        // 每30秒清理一次音频池
        this.cleanupInterval = setInterval(() => {
            this.audioPools.forEach((pool, name) => {
                this.cleanupAudioPool(name);
            });
        }, 30000);
    }
    
    loadGameSounds() {
        // 映射游戏音效到原游戏文件
        const soundMappings = {
            'shoot': 'assets/audio/whoosh.mp3',      // 发射音效
            'pop': 'assets/audio/bubblepop.mp3',     // 泡泡爆炸
            'match': 'assets/audio/bubblepop2.mp3',  // 匹配消除
            'hit': 'assets/audio/hit.mp3',           // 碰撞
            'refill': 'assets/audio/booster.mp3',    // 新行补充
            'game_over': 'assets/audio/lost.mp3',    // 游戏失败
            'victory': 'assets/audio/won.mp3',       // 游戏胜利
            'button': 'assets/audio/buttonClick.mp3' // 按钮点击
        };
        
        // 加载所有音效
        Object.entries(soundMappings).forEach(([name, url]) => {
            this.loadSound(name, url).catch(error => {
                console.warn(`Failed to load sound ${name}:`, error);
                // 如果加载失败，使用合成音效作为备用
                this.createSyntheticSound(name);
            });
        });
    }
    
    createSyntheticSounds() {
        // 创建合成音效，避免依赖外部音频文件
        if (!this.audioContext) return;
        
        this.sounds.set('shoot', () => this.createTone(440, 0.1, 'sine'));
        this.sounds.set('pop', () => this.createTone(880, 0.15, 'square'));
        this.sounds.set('match', () => this.createChord([523, 659, 783], 0.3));
        this.sounds.set('refill', () => this.createTone(330, 0.2, 'sawtooth'));
        this.sounds.set('game_over', () => this.createDescendingTone());
    }
    
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createChord(frequencies, duration) {
        if (!this.audioContext) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, duration * 0.8, 'sine');
            }, index * 50);
        });
    }
    
    createDescendingTone() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 1);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1);
    }
    
    createAscendingTone() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.8);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }
    
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                // 初始化音频池
                this.audioPools.set(name, []);
                
                this.sounds.set(name, () => {
                    if (this.muted) return;
                    
                    // 从池中获取或创建音频实例
                    const audioInstance = this.getAudioInstance(name, audio);
                    audioInstance.volume = this.sfxVolume;
                    audioInstance.currentTime = 0; // 重置播放位置
                    
                    // 添加到活跃实例集合
                    this.activeAudioInstances.add(audioInstance);
                    
                    // 播放音频并处理错误
                    const playPromise = audioInstance.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.warn(`Audio play failed for ${name}:`, e);
                            this.releaseAudioInstance(name, audioInstance);
                        });
                    }
                    
                    // 播放结束后返回到池中
                    const onEnded = () => {
                        this.releaseAudioInstance(name, audioInstance);
                        audioInstance.removeEventListener('ended', onEnded);
                        audioInstance.removeEventListener('pause', onEnded);
                        audioInstance.removeEventListener('error', onEnded);
                    };
                    
                    audioInstance.addEventListener('ended', onEnded);
                    audioInstance.addEventListener('pause', onEnded);
                    audioInstance.addEventListener('error', onEnded);
                });
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`Failed to load audio ${name} from ${url}:`, e);
                reject(e);
            });
            
            // 设置音频源并开始加载
            audio.src = url;
            audio.preload = 'auto';
            audio.load();
        });
    }
    
    // 创建单个合成音效作为备用
    createSyntheticSound(name) {
        if (!this.audioContext) return;
        
        const soundConfigs = {
            'shoot': { freq: 440, duration: 0.15, type: 'sine' },
            'pop': { freq: 880, duration: 0.1, type: 'square' },
            'match': { freq: [523, 659, 783], duration: 0.3, type: 'chord' },
            'hit': { freq: 330, duration: 0.08, type: 'sawtooth' },
            'refill': { freq: 220, duration: 0.2, type: 'triangle' },
            'game_over': { freq: 'descending', duration: 1, type: 'special' },
            'victory': { freq: 'ascending', duration: 0.8, type: 'special' },
            'button': { freq: 660, duration: 0.05, type: 'sine' }
        };
        
        const config = soundConfigs[name];
        if (!config) return;
        
        if (config.type === 'chord') {
            this.sounds.set(name, () => this.createChord(config.freq, config.duration));
        } else if (config.type === 'special') {
            if (config.freq === 'descending') {
                this.sounds.set(name, () => this.createDescendingTone());
            } else if (config.freq === 'ascending') {
                this.sounds.set(name, () => this.createAscendingTone());
            }
        } else {
            this.sounds.set(name, () => this.createTone(config.freq, config.duration, config.type));
        }
    }

    // 音频池管理方法
    getAudioInstance(name, sourceAudio) {
        const pool = this.audioPools.get(name);
        if (!pool) return sourceAudio.cloneNode();
        
        // 从池中获取空闲实例
        const freeInstance = pool.find(instance => 
            instance.paused && instance.currentTime === 0
        );
        
        if (freeInstance) {
            return freeInstance;
        }
        
        // 如果池未满，创建新实例
        if (pool.length < this.maxPoolSize) {
            const newInstance = sourceAudio.cloneNode();
            pool.push(newInstance);
            return newInstance;
        }
        
        // 池已满，重用最旧的实例
        const reusedInstance = pool[0];
        if (!reusedInstance.paused) {
            reusedInstance.pause();
            reusedInstance.currentTime = 0;
        }
        return reusedInstance;
    }
    
    releaseAudioInstance(name, audioInstance) {
        // 从活跃实例集合中移除
        this.activeAudioInstances.delete(audioInstance);
        
        // 停止播放并重置
        if (!audioInstance.paused) {
            audioInstance.pause();
        }
        audioInstance.currentTime = 0;
        
        // 实例会保留在池中供重用
    }
    
    // 清理超过限制的音频实例
    cleanupAudioPool(name) {
        const pool = this.audioPools.get(name);
        if (!pool) return;
        
        // 保留最近使用的实例，移除多余的
        if (pool.length > this.maxPoolSize) {
            const toRemove = pool.splice(this.maxPoolSize);
            toRemove.forEach(instance => {
                if (!instance.paused) {
                    instance.pause();
                }
                instance.src = '';
                instance.load(); // 释放资源
            });
        }
    }
    
    playSound(name) {
        if (this.muted) return;
        
        const soundPlayer = this.sounds.get(name);
        if (soundPlayer) {
            try {
                soundPlayer();
            } catch (e) {
                console.warn(`Failed to play sound ${name}:`, e);
            }
        }
    }
    
    // 播放射击音效
    playShoot() {
        this.playSound('shoot');
    }
    
    // 播放泡泡爆炸音效
    playPop() {
        this.playSound('pop');
    }
    
    // 播放匹配音效
    playMatch() {
        this.playSound('match');
    }
    
    // 播放碰撞音效
    playHit() {
        this.playSound('hit');
    }
    
    // 播放补充音效
    playRefill() {
        this.playSound('refill');
    }
    
    // 播放游戏结束音效
    playGameOver() {
        this.playSound('game_over');
    }
    
    // 播放胜利音效
    playVictory() {
        this.playSound('victory');
    }
    
    // 播放按钮点击音效
    playButton() {
        this.playSound('button');
    }
    
    // 设置音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    // 音乐功能已禁用
    setMusicVolume(volume) {
        console.warn('音乐功能已被禁用');
    }

    playMusic(name) {
        console.warn('音乐功能已被禁用');
    }

    stopMusic() {
        console.warn('音乐功能已被禁用');
    }
    
    // 静音控制
    toggleMute() {
        this.muted = !this.muted;
        this.saveSettings();
        return this.muted;
    }
    
    setMuted(muted) {
        this.muted = muted;
        this.saveSettings();
    }
    
    isMuted() {
        return this.muted;
    }
    
    // 保存设置到本地存储
    saveSettings() {
        const settings = {
            sfxVolume: this.sfxVolume,
            muted: this.muted
        };
        
        localStorage.setItem('eggBubbleAudioSettings', JSON.stringify(settings));
    }
    
    // 从本地存储加载设置
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('eggBubbleAudioSettings') || '{}');
            
            this.sfxVolume = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.8;
            this.muted = settings.muted || false;
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
        }
    }
    
    // 恢复音频上下文（处理浏览器自动播放策略）
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }
    
    // 销毁音频管理器
    destroy() {
        // 停止清理定时器
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // 停止所有活跃的音频实例
        this.activeAudioInstances.forEach(instance => {
            if (!instance.paused) {
                instance.pause();
            }
            instance.src = '';
            instance.load(); // 释放资源
        });
        this.activeAudioInstances.clear();
        
        // 清理所有音频池
        this.audioPools.forEach((pool, name) => {
            pool.forEach(instance => {
                if (!instance.paused) {
                    instance.pause();
                }
                instance.src = '';
                instance.load(); // 释放资源
            });
        });
        this.audioPools.clear();
        
        // 清理音效映射
        this.sounds.clear();
        
        // 关闭音频上下文
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
    
    // 添加一个方法来获取当前活跃的音频实例数量，用于调试
    getActiveInstanceCount() {
        return this.activeAudioInstances.size;
    }
    
    // 获取音频池状态，用于调试
    getPoolStatus() {
        const status = {};
        this.audioPools.forEach((pool, name) => {
            status[name] = {
                total: pool.length,
                active: pool.filter(instance => !instance.paused).length,
                idle: pool.filter(instance => instance.paused).length
            };
        });
        return status;
    }
}
