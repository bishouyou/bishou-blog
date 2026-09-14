---
share: true
comments: true
target: notes/AI
date: 2026-09-14
categories:
  - AI
  - 本地部署
title: 四到七倍速度提升——AI本地部署指南
---
0. AI引擎选择：
   - 首推LM Studio 功能完整 强大易用 相较llama.cpp性能几乎无损 
   - 次推llama.cpp 开源 是大多数个人电脑部署ai引擎的内核 功能少 但是因为没有图形界面及其他功能 资源占用相对较少 适合二次开发 
   - 愿意折腾可以在wsl中用vllm ~~那显得你很专业~~
     
> [!NOTE] 关于ollama
> ollama的优化巨差无比 lm和llama.cpp是它速度的1.8倍 功能极少 而且完全无视开源精神 不标内核出处 不能和别的引擎互通模型 没有自动优化 鉴定为电子垃圾

1. 模型选择：模型一定使用MOE模型 目前小规模大语言模型以qwen系列为首 推荐使用著名组织unsloth的量化模型 量化一定不低于Q4 即使要换参数量更小的模型 除非你知道你在做什么 也不要使用NVMP4等新型量化 除非你知道你在做什么

> [!本地模型很傻？]
>    不要再用deepseek、gpt、GLM或者天知道的什么模型了 只要你使用千问 那么你注定度过一个相对成功的人生

#### LM Studio设置
	大多在模型页面的设置的load选项修改 也可以在首页临时修改进行测试

2. 模型上下文：按需分配 
   
3. GPU卸载：拉满 尽可能进入显存
   
4. Number of layers for which to force the experts into CPU：将专家组件利用cpu计算 需要根据模型和硬件进行调试 一般20到35 建议使用二分法确定大概范围后多次测试求取平均值 ~~或者像我一样摆烂不求平均~~
   我的设置：
	- unsloth/qwen3.6 35b a3b IQ3XXS： 使用25
	- unsloth/qwen3.6 35b a3b Q4_K_S：使用24

5. 开启快速注意力 开启kv缓存量化类型 设置为q8_0：快速注意力利用GPU高速缓存突破显存I/O限制 不影响精度；KV缓存能将上下文进行压缩节省显存 int8精度几乎无损 也可以使用int4精度

6. CPU线程池大小：拉满 同时拉满`inference`选项中的CPU线程 能力不大 但是肯定有
   
7. `set CUDA_SCALE_LAUNCH_QUEUES=4` 放大 CPU 提交给 GPU 的 **“命令缓冲区”** 大小 目前来看作用有限 可能在长上下文时比较有用
   此设置在LM Studio 中并没有对应选项 可以在开启时通过命令行设置 长期使用推荐创建批处理文件
#### 性能示例
本机配置：RTX 5070TI taptop 12G显存版、AMD R9 9955HX 16核、32G内存
模型速度：
- unsloth/qwen3.6 35b a3b Q4_K_S ：约38-45token/s
- unsloth/qwen3.6 35b a3b IQ3XXS ：约43-49token/s
优化前速度：
- unsloth/qwen3.6 35b a3b Q4_K_S ：约5.6-6.8token/s
- unsloth/qwen3.6 35b a3b IQ3XXS ：约9.5-11token/s
#### 写在后面

与一般人想象的不同 本地部署AI的瓶颈一般不在GPU的计算能力 而是在显存、内存、显卡和CPU的缓存的I/O上 任何有关优化I/O的方法都有助于显卡发挥真正的算力 为什么看似显卡跑满100% 但是温度不高风扇不转 就是因为在等待I/O 

同时 将GPU的一部分计算转移到CPU上 也有助于缓解I/O压力和GPU的计算压力 解决了GPU有难、CPU围观的问题

这提醒我们要抓住主要矛盾~~(?)~~ 事实和我们想的很可能不一样 12G甚至8G的显存也可以跑35B的模型 并且有很不错的速度 7倍左右的优化幅度能证明这一点
