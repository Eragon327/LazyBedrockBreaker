const whiteList = new Set([
    "minecraft:bedrock"
]);

let funcIsOpen = false;

// 加载语言文件
let lang = {};
try {
    lang = JSON.parse(file.readFrom("./plugins/LazyBedrockBreaker/zh-cn.json"));
} catch (e) {
    logger.error("语言文件加载失败：" + e);
}

// 语言文本替换函数
function tr(key, replacements = {}) {
    let text = lang[key] || key;
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

mc.listen("onServerStarted", () => {
    const bb = mc.newCommand("bedrockbreak", tr("cmdDesc_bb"), PermType.Any, 0x80, "bb");
    bb.setEnum("statusAction", ["isopen"]);
    bb.setEnum("listAction", ["list"]);
    bb.mandatory("action", ParamType.Enum, "statusAction");
    bb.mandatory("action", ParamType.Enum, "listAction");
    bb.mandatory("isOpen", ParamType.Bool);
    bb.overload(["statusAction", "isOpen"]);
    bb.overload(["listAction"]);
    bb.setCallback((_cmd, ori, out, res) => {
        const player = ori.player;
        if (!player) return out.error(tr("error_unknownPlayer"));
        switch (res.action) {
            case "isopen":
                if (!funcIsOpen) {
                    out.error(tr("error_funcNotOpen"))
                    break;
                }
                if (res.isOpen) {
                    player.addTag("BedrockBreak_Open");
                    out.success(tr("success_funcEnabled"));
                } else {
                    player.removeTag("BedrockBreak_Open");
                    out.success(tr("success_funcDisabled"));
                }
                break;
            case "list":
                out.success(tr("success_whitelistHeader"));
                for (const type of whiteList) {
                    out.success(`- ${type}`);
                }
                break;
        }
    });
    bb.setup();

    const bbmaster = mc.newCommand("bedrockbreakmaster", tr("cmdDesc_bbmaster"), PermType.Any, 0x80, "bbmaster");
    bbmaster.setEnum("statusAction", ["isopen"]);
    bbmaster.setEnum("addAction", ["add"]);
    bbmaster.setEnum("removeAction", ["remove"]);
    bbmaster.setEnum("resetAction", ["reset"]);
    bbmaster.setEnum("listAction", ["list"]);
    bbmaster.mandatory("action", ParamType.Enum, "statusAction");
    bbmaster.mandatory("action", ParamType.Enum, "addAction");
    bbmaster.mandatory("action", ParamType.Enum, "removeAction");
    bbmaster.mandatory("action", ParamType.Enum, "resetAction");
    bbmaster.mandatory("action", ParamType.Enum, "listAction");
    bbmaster.mandatory("isOpen", ParamType.Bool);
    bbmaster.overload(["statusAction", "isOpen"]);
    bbmaster.overload(["addAction"]);
    bbmaster.overload(["removeAction"]);
    bbmaster.overload(["resetAction"]);
    bbmaster.overload(["listAction"]);
    bbmaster.setCallback((_cmd, ori, out, res) => {
        const player = ori.player;
        if (!player) return out.error(tr("error_unknownPlayer"));
        const block = player.getBlockFromViewVector();
        switch (res.action) {
            case "isopen":
                funcIsOpen = res.isOpen;
                const status = funcIsOpen ? tr("status_enabled") : tr("status_disabled");
                out.success(tr("success_globalFuncToggled", { status }));
                logger.warn(tr("log_adminToggled", { player: player.name, status }));
                break;
            case "add":
                if (!block) {
                    out.error(tr("error_aimAtBlock"));
                    break;
                }
                else if (whiteList.has(block.type)) {
                    out.error(tr("error_blockInWhitelist"));
                    break;
                }
                else {
                    whiteList.add(block.type);
                    out.success(tr("success_blockAdded", { block: block.type }));
                    logger.warn(tr("log_blockAdded", { player: player.name, block: block.type }));
                }
                break;
            case "remove":
                if (!block) {
                    out.error(tr("error_aimAtBlock"));
                    break;
                }
                else if (!whiteList.has(block.type)) {
                    out.error(tr("error_blockNotInWhitelist"));
                    break;
                }
                else {
                    whiteList.delete(block.type);
                    out.success(tr("success_blockRemoved", { block: block.type }));
                    logger.warn(tr("log_blockRemoved", { player: player.name, block: block.type }));
                }
                break;
            case "reset":
                whiteList.clear();
                whiteList.add("minecraft:bedrock");
                out.success(tr("success_whitelistReset"));
                logger.warn(tr("log_whitelistReset", { player: player.name }));
                break;
            case "list":
                out.success(tr("success_whitelistHeader"));
                for (const type of whiteList) {
                    out.success(`- ${type}`);
                }
                break;
        }
    });
    bbmaster.setup();
});

class patchManager {
    constructor() {
        this.blockPatch = new Map();
    }

    add(playerXuid, bedrockPos, clickPos) {
        if (!this.blockPatch.has(playerXuid)) {
            this.blockPatch.set(playerXuid, { bedrockPos, clickPos });
        }
        return this;
    }

    clear() {
        this.blockPatch.clear();
        return this;
    }

    has(playerXuid) {
        return this.blockPatch.has(playerXuid);
    }

    get(playerXuid) {
        return this.blockPatch.get(playerXuid) || null;
    }
}
const patches = new patchManager();

class tools{
    // 活塞方向数字转方向对象
    static pistonFacing = [
        { dx: 0, dy: -1, dz: 0 },   // down 0
        { dx: 0, dy: 1, dz: 0 },    // up 1
        { dx: 0, dy: 0, dz: 1 },    // south 2
        { dx: 0, dy: 0, dz: -1 },   // north 3
        { dx: 1, dy: 0, dz: 0 },    // east 4
        { dx: -1, dy: 0, dz: 0 }    // west 5
    ];

    // 空间向量加法
    static vectorAdd(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y,
            z: v1.z + v2.z
        };
    }

    // 空间向量减法
    static vectorMinus(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y,
            z: v1.z - v2.z
        };
    }

    // 空间向量点积
    static vectorDot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    // 空间向量数乘
    static vectorDotScalar(v, s) {
        return {
            x: v.x * s,
            y: v.y * s,
            z: v.z * s
        };
    }

    // 两点间距离
    static distance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    }

    // 两点之间的方向向量
    static directionVector(pos1, pos2) {
        const length = this.distance(pos1, pos2);
        return {
            x: (pos2.x - pos1.x) / length,
            y: (pos2.y - pos1.y) / length,
            z: (pos2.z - pos1.z) / length
        }
    }

    // 比较两个位置是否相等
    static equalsPos(pos1, pos2) {
        return pos1.x === pos2.x &&
               pos1.y === pos2.y &&
               pos1.z === pos2.z &&
               pos1.dimid === pos2.dimid;
    }

    // 获取指向方块位置
    static getTargetPos(pos, dir) {
        return new IntPos(
            pos.x + dir.dx,
            pos.y + dir.dy,
            pos.z + dir.dz,
            pos.dimid
        ) || null;
    }
}

class Functions{
    /**
     * 计算玩家看向的方块面
     * @param {IntPos} blockPos     方块所在坐标 block.pos {x: number, y: number, z: number, dimid: number}
     * @param {FloatPos} playerPos  玩家所在坐标 player.pos {x: number, y: number, z: number, dimid: number}
     * @param {FloatPos} clickPos   玩家点击位置 {x: number, y: number, z: number, dimid: number}
     * @returns {Number}            面向的方块面编号，-1表示无法确定 
     */
    static getWatchingFace(blockPos, playerPos, clickPos) {
        // 玩家视线的方向向量d, 玩家视线起点O
        const d = tools.directionVector(playerPos, clickPos);
        const O = {
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z
        };
    
        // 六个面的法向量n, 两个基底向量u, v, 面的中心点P, 面的编号face
        const blockFaces = [
            {   // down
                n: { x: 0, y: -1, z: 0 },
                u: { x: 1, y: 0, z: 0 },
                v: { x: 0, y: 0, z: 1 },
                P: { x: blockPos.x + 0.5, y: blockPos.y, z: blockPos.z + 0.5 },
                face: 0
            },
            {   // up
                n: { x: 0, y: 1, z: 0 },
                u: { x: 1, y: 0, z: 0 },
                v: { x: 0, y: 0, z: 1 },
                P: { x: blockPos.x + 0.5, y: blockPos.y + 1, z: blockPos.z + 0.5 },
                face: 1
            },
            {   // south
                n: { x: 0, y: 0, z: 1 },
                u: { x: 1, y: 0, z: 0 },
                v: { x: 0, y: 1, z: 0 },
                P: { x: blockPos.x + 0.5, y: blockPos.y + 0.5, z: blockPos.z + 1 },
                face: 2
            },
            {   // north
                n: { x: 0, y: 0, z: -1 },
                u: { x: 1, y: 0, z: 0 },
                v: { x: 0, y: 1, z: 0 },
                P: { x: blockPos.x + 0.5, y: blockPos.y + 0.5, z: blockPos.z },
                face: 3
            },
            {   // east
                n: { x: 1, y: 0, z: 0 },
                u: { x: 0, y: 1, z: 0 },
                v: { x: 0, y: 0, z: 1 },
                P: { x: blockPos.x + 1, y: blockPos.y + 0.5, z: blockPos.z + 0.5 },
                face: 4
            },
            {   // west
                n: { x: -1, y: 0, z: 0 },
                u: { x: 0, y: 1, z: 0 },
                v: { x: 0, y: 0, z: 1 },
                P: { x: blockPos.x, y: blockPos.y + 0.5, z: blockPos.z + 0.5 },
                face: 5
            }
        ];
    
        // 开始遍历每个面，计算交点
        const results = [];
        for (const faceInfo of blockFaces) { 
            const n = faceInfo.n;
            const P = faceInfo.P;
            const t = tools.vectorDot(tools.vectorMinus(P, O), n) / tools.vectorDot(d, n);
    
            // 交点x
            const x = tools.vectorAdd(O, tools.vectorDotScalar(d, t));
    
            // 判断交点是否在面内
            const u = tools.vectorDot(tools.vectorMinus(x, P), faceInfo.u);
            const v = tools.vectorDot(tools.vectorMinus(x, P), faceInfo.v);
    
            if (u >= -0.5 && u <= 0.5 && v >= -0.5 && v <= 0.5) {
                results.push({
                    face: faceInfo.face,
                    distance: tools.distance(O, x)
                });
            }
        }
    
        if (results.length === 0) {
            return -1; // 无交点
        }
    
        // 找到距离最近的交点
        results.sort((a, b) => a.distance - b.distance);
        return results[0].face;
    }

    /**
     * 创建优先级方向数组
     * @param {IntPos} blockPos     方块所在坐标 block.pos {x: number, y: number, z: number, dimid: number}
     * @param {FloatPos} playerPos  玩家所在坐标 player.pos {x: number, y: number, z: number, dimid: number}
     * @param {Number} facing       玩家看向的方块面编号
     * @returns {Number[]}          优先级方向数组
     */
    static createPriorityDirectionArray(blockPos, playerPos, facing) {
        const priorityDirections = [];
        const dx = playerPos.x - (blockPos.x + 0.5);
        const dy = playerPos.y - (blockPos.y + 0.5);
        const dz = playerPos.z - (blockPos.z + 0.5);

        // 看向的方向为最后优先级, 对向为第一优先级
        const facingIndex = facing;
        const oppositeIndex = facingIndex % 2 === 0 ? facingIndex + 1 : facingIndex - 1;
        priorityDirections.push(oppositeIndex);

        // 剩下的四个方向点积排序, 点积越小优先级越高
        const otherDirections = [];
        for (let i = 0; i < tools.pistonFacing.length; i++) {
            if (i !== facingIndex && i !== oppositeIndex) {
                const dir = tools.pistonFacing[i];
                const dotProduct = dx * dir.dx + dy * dir.dy + dz * dir.dz;
                otherDirections.push({ index: i, dot: dotProduct });
            }
        }
        otherDirections.sort((a, b) => a.dot - b.dot);
        for (const dir of otherDirections) {
            priorityDirections.push(dir.index);
        }

        priorityDirections.push(facingIndex);
        return priorityDirections;
    }
}


mc.listen("onUseItemOn", (player, item, block, _side, pos) => {
    if (!funcIsOpen ||
        !player.hasTag("BedrockBreak_Open") ||
        (item.type !== "minecraft:piston" && item.type !== "minecraft:sticky_piston") ||
        !whiteList.has(block.type)
    ) {
        return;
    }
    patches.add(player.xuid, block.pos, pos);
});

mc.listen("afterPlaceBlock", (player, block) => {
    if (!funcIsOpen ||
        !player.hasTag("BedrockBreak_Open") ||
        (block.type !== "minecraft:piston" && block.type !== "minecraft:sticky_piston") ||
        !patches.has(player.xuid)
    ) {
        return;
    }
    const { bedrockPos, clickPos } = patches.get(player.xuid);

    // 获取玩家看向的方块面
    const facing = Functions.getWatchingFace(
        block.pos,
        player.pos,
        clickPos
    );
    if (facing === -1) {
        return;
    }

    // 创建优先级方向数组
    const priorityDirections = Functions.createPriorityDirectionArray(
        block.pos,
        player.pos,
        facing
    );

    let successfullyPlaced = false;

    // 找到第一个空气方块并放置活塞, 删除以已使用的方向
    successfullyPlaced = false;
    let currentDirection = -1;
    const copyPriorityDirections = [...priorityDirections];
    for (const dirIndex of priorityDirections) {
        const dir = tools.pistonFacing[dirIndex];
        const targetPos = tools.getTargetPos(block.pos, dir);
        if (mc.getBlock(targetPos).type === "minecraft:air") {
            mc.setBlock(block.pos, block.type, dirIndex);
            copyPriorityDirections.splice(copyPriorityDirections.indexOf(dirIndex), 1);
            successfullyPlaced = true;
            currentDirection = dirIndex;
            break;
        }
        else {
            copyPriorityDirections.splice(copyPriorityDirections.indexOf(dirIndex), 1);
        }
    }
    if (!successfullyPlaced) {
        return;
    }

    // 首先检查有没有红石块
    let hasRedstoneBlock = false;
    let redstoneBlock;
    for (const dir of tools.pistonFacing) {
        const targetPos = tools.getTargetPos(block.pos, dir);
        if (mc.getBlock(targetPos).type === "minecraft:redstone_block") {
            redstoneBlock = mc.getBlock(targetPos);
            hasRedstoneBlock = true;
            break;
        }
    }

    if (!hasRedstoneBlock) {
        // 判断玩家是否有红石块
        const inv = player.getInventory().getAllItems();
        let found = false;
        for (const item of inv) {
            if (item.type === "minecraft:redstone_block") {
                found = true;
                break;
            }
        }
        
        // 放置红石块
        if (found || player.isCreative) {
            successfullyPlaced = false;
            for (const dirIndex of copyPriorityDirections) {
                const dir = tools.pistonFacing[dirIndex];
                const targetPos = tools.getTargetPos(block.pos, dir);
                if (mc.getBlock(targetPos).type === "minecraft:air") {
                    mc.setBlock(targetPos, "minecraft:redstone_block");
                    redstoneBlock = mc.getBlock(targetPos);
                    successfullyPlaced = true;
                    if (!player.isCreative) {
                        player.clearItem("minecraft:redstone_block", 1);
                    }
                    break;
                }
            }
            if (!successfullyPlaced) {
                return;
            }
        }
    }

    // 获取目标活塞方向
    let targetDirection = -1;
    for (const dir of tools.pistonFacing) {
        const targetPos = tools.getTargetPos(block.pos, dir);
        if (tools.equalsPos(targetPos, bedrockPos)) {
            targetDirection = tools.pistonFacing.indexOf(dir);
            break;
        }
    }
    if (targetDirection === -1) {
        return;
    }

    // 转到目标方向
    setTimeout(() => {
        mc.setBlock(block.pos, block.type, targetDirection);
        redstoneBlock.destroy(!player.isCreative);
        setTimeout(() => {
            block.destroy(!player.isCreative);
        }, 160);
    }, 160);

});

mc.listen("onTick", () => {
    patches.clear();
});