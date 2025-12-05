# LazyBedrockBreaker
Minecraft基岩版一键破基岩辅助，基于[LegacyScriptEngine](https://github.com/LiteLDev/LegacyScriptEngine)。

## 如何安装
1. 安装 LegacyScriptEngine([官方教程](https://lse.levimc.org/zh/))
2. 下载 [最新Release](https://github.com/Eragon327/LazyBedrockBreaker/releases)
3. 解压，将整个文件夹放到服务器 'plugins' 目录下
4. 重启服务器，或在服务器控制台输入 'll load LazyBedrockBreaker'

## 如何使用
### /bb 所有玩家均可使用  
/bb isopen true | false 开关懒狗破基岩（需要全局设置开启）  
/bb list 查看方块白名单内所有方块的类型  
### /bbmaster 仅管理员可用  
/bbmaster isopen true | false 开关全局懒狗破基岩  
/bbmaster add 把指着的方块加入到方块白名单  
/bbmaster remove 把指着的方块移出方块白名单  
/bbmaster reset 重置方块白名单  
/bbmaster list 同 /bb list
### 确保功能开启后
确保背包里有至少一个红石块，手持活塞/粘性活塞点击你要破的基岩即可

## 兼容性
Minecraft Bedrock Edition 1.21.93  
其他版本未测试

# LazyBedrockBreaker
A one-click bedrock breaking tool for Minecraft Bedrock Edition, based on [LegacyScriptEngine](https://github.com/LiteLDev/LegacyScriptEngine).

## How to Install
1. Install LegacyScriptEngine ([Official Guide](https://lse.levimc.org/zh/))
2. Download the [latest Release](https://github.com/Eragon327/LazyBedrockBreaker/releases)
3. Extract the archive and place the entire folder into the server's 'plugins' directory
4. Restart the server, or run the command 'll load LazyBedrockBreaker' in the server console

## How to Use
### /bb Available to all players  
/bb isopen true | false Turn on/off Lazy Bedrock Breaking (requires the global setting to be enabled)  
/bb list View all block types in the block whitelist  
### /bbmaster Available to administrators only  
/bbmaster isopen true | false Turn on/off global Lazy Bedrock Breaking  
/bbmaster add Add the targeted block to the block whitelist  
/bbmaster remove Remove the targeted block from the block whitelist  
/bbmaster reset Reset the block whitelist  
/bbmaster list Same as /bb list  
### Ensure the feature is enabled
Make sure you have at least one redstone block in your inventory. Hold a piston/sticky piston and click on the bedrock you want to break.

## Compatibility
Minecraft Bedrock Edition 1.21.93  
Other versions have not been tested
