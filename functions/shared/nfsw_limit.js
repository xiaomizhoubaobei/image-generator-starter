/**
 * NSFW 内容检测工具
 * 提供敏感内容检测功能，用于过滤图像生成提示词中的不适宜内容
 * 
 * 支持的语言：
 * - 英文敏感词（身体部位、性行为、成人内容等）
 * - 中文敏感词（身体部位、性行为、成人内容等）
 * 
 * 使用场景：
 * - 在图像生成前检测提示词是否包含敏感内容
 * - 防止生成不适宜的图像
 * - 内容审核和合规性检查
 */

// ==================== 英文敏感词库 ====================

// 身体部位相关词汇
const BODY_PARTS = [
  'penis', 'vagina', 'cock', 'dick', 'pussy', 'cunt', 'boobs', 'tits', 
  'nipples', 'breast', 'ass', 'butt', 'anus', 'genitals', 'crotch',
  'clitoris', 'labia', 'scrotum', 'testicles', 'balls',
  
  // 变体写法
  'p3nis', 'v4gina', 'c0ck', 'd1ck', 'b00bs', 't1ts', 'n1pples',
  'br3ast', '4ss', 'gen1tals', 'cr0tch',
  
  // 口语表达
  'boobies', 'titties', 'knockers', 'jugs', 'melons', 'hooters',
  'shaft', 'rod', 'member', 'manhood', 'package', 'junk',
  'rear', 'behind', 'bottom', 'backside', 'rump', 'bum'
];

// 性行为相关词汇
const SEXUAL_ACTS = [
  'sex', 'fuck', 'fucking', 'intercourse', 'oral', 'anal', 'masturbate',
  'orgasm', 'climax', 'cum', 'cumming', 'ejaculate', 'penetration',
  'foreplay', 'handjob', 'blowjob', 'cunnilingus', 'fellatio',
  
  // 变体写法
  'f*ck', 'f**k', 'fck', 'fuk', 'phuck', 's3x', 'm4sturbate',
  'org4sm', 'cl1max', 'ej4culate', 'penetr4tion',
  
  // 口语表达
  'hook up', 'make love', 'get it on', 'do it', 'bang', 'screw',
  'shag', 'hump', 'bone', 'nail', 'pound', 'smash', 'tap',
  'ride', 'mount', 'thrust', 'stroke', 'rub', 'touch',
  
  // BDSM 相关
  'bdsm', 'bondage', 'domination', 'submission', 'sadism', 'masochism',
  'whip', 'spank', 'tie up', 'bound', 'slave', 'master', 'mistress'
];

// 成人内容相关词汇
const ADULT_CONTENT = [
  'porn', 'porno', 'pornography', 'xxx', 'adult', 'erotic', 'erotica',
  'nsfw', 'nude', 'naked', 'nudity', 'strip', 'stripper', 'escort',
  'prostitute', 'hooker', 'whore', 'slut', 'bitch',
  
  // 变体写法
  'p0rn', 'p*rn', 'pr0n', 'nud3', 'n4ked', 'n5fw', 'str1p',
  'escort', 'pr0stitute', 'h00ker', 'wh0re', 'sl*t', 'b*tch',
  
  // 平台和网站
  'camgirl', 'webcam', 'onlyfans', 'chaturbate', 'pornhub',
  'milf', 'gilf', 'teen', 'barely legal', 'jailbait',
  
  // 性取向和多人
  'lesbian', 'gay', 'bisexual', 'threesome', 'orgy', 'gangbang',
  'bukkake', 'creampie', 'facial', 'dp', 'mmf', 'ffm'
];

// 服装状态相关词汇
const CLOTHING_STATE = [
  'topless', 'bottomless', 'braless', 'pantyless', 'commando',
  'undressed', 'unclothed', 'disrobed', 'exposed', 'revealing',
  'skimpy', 'scanty', 'provocative', 'seductive', 'sultry',
  'lingerie', 'underwear', 'panties', 'bra', 'thong', 'g-string',
  'bikini', 'swimsuit', 'bathing suit', 'negligee', 'teddy'
];

// ==================== 中文敏感词库 ====================

// 身体部位相关词汇
const CHINESE_BODY = [
  '阴茎', '阴道', '乳房', '胸部', '臀部', '屁股', '生殖器', '下体',
  '乳头', '阴唇', '阴蒂', '睾丸', '龟头', '包皮', '肛门',
  
  // 口语表达
  '鸡鸡', '小弟弟', '老二', '命根子', '鸟', '屌', '奶子', '咪咪',
  '波霸', '巨乳', '美乳', '翘臀', '肥臀', '蜜桃臀', '美臀',
  
  // 代称
  'jj', 'dd', 'nz', 'pp', '那里', '那个地方', '私处'
];

// 性行为相关词汇
const CHINESE_SEXUAL = [
  '性交', '做爱', '性爱', '交配', '性行为', '房事', '云雨', '床笫',
  '手淫', '自慰', '撸管', '打飞机', '高潮', '射精', '性高潮',
  '口交', '肛交', '69', '后入', '传教士', '骑乘', '侧位',
  
  // 网络用语
  '啪啪啪', '嘿咻', '羞羞', '不可描述', '开车', '老司机',
  'xxoo', 'ml', 'ppp', '车震', '野战', '一夜情', '约炮',
  
  // 文雅表达
  '鱼水之欢', '巫山云雨', '共赴云雨', '春宵一刻', '颠鸾倒凤'
];

// 成人内容相关词汇
const CHINESE_ADULT = [
  '色情', '黄片', '毛片', 'AV', '成人片', '三级片', '情色', '艳情',
  '裸体', '全裸', '半裸', '果体', '天体', '裸照', '艳照', '裸',
  '脱衣', '脱光', '一丝不挂', '赤身裸体', '光着身子',
  
  // 相关行业
  '妓女', '鸡', '小姐', '失足妇女', '援交', '包养', '二奶',
  '鸭子', '牛郎', '陪酒女', '红灯区', '风月场所',
  
  // 网络用语
  '老湿', '湿了', '硬了', '撸', '鲁', '屌丝', '骚', '浪', '荡'
];

/**
 * 检测文本是否包含敏感内容
 * 
 * 该函数会检查输入文本中是否包含任何敏感词汇（中英文）
 * 匹配是大小写不敏感的
 * 
 * @param {string} text - 待检测的文本内容
 * @returns {Object} 检测结果对象，包含以下属性：
 *   - hasSensitive: boolean - 是否包含敏感内容
 *   - matchedWords: string[] - 匹配到的敏感词列表
 * 
 * @example
 * const result = checkSensitiveContent('一张美丽的风景画');
 * // 返回: { hasSensitive: false, matchedWords: [] }
 * 
 * const result = checkSensitiveContent('一张裸体艺术画');
 * // 返回: { hasSensitive: true, matchedWords: ['裸体'] }
 */
function checkSensitiveContent(text) {
  // 检查输入是否有效
  if (!text || typeof text !== 'string') {
    return { hasSensitive: false, matchedWords: [] };
  }

  // 合并所有敏感词库为一个数组
  const SENSITIVE_WORDS = [
    ...BODY_PARTS,
    ...SEXUAL_ACTS,
    ...ADULT_CONTENT,
    ...CLOTHING_STATE,
    ...CHINESE_BODY,
    ...CHINESE_SEXUAL,
    ...CHINESE_ADULT,
  ];

  // 将输入文本转换为小写（用于不区分大小写的匹配）
  const lowerText = text.toLowerCase();
  const matchedWords = [];

  // 遍历所有敏感词，检查文本中是否包含
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      matchedWords.push(word);
    }
  }

  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords: matchedWords
  };
}

/**
 * 获取所有敏感词库分类
 * 
 * 返回所有敏感词分类的完整列表，用于参考和调试
 * 
 * @returns {Object} 包含所有敏感词分类的对象
 */
function getAllSensitiveWords() {
  return {
    BODY_PARTS,        // 英文身体部位
    SEXUAL_ACTS,       // 英文性行为
    ADULT_CONTENT,     // 英文成人内容
    CLOTHING_STATE,    // 英文服装状态
    CHINESE_BODY,      // 中文身体部位
    CHINESE_SEXUAL,    // 中文性行为
    CHINESE_ADULT      // 中文成人内容
  };
}

// 导出函数供其他模块使用
export {
  checkSensitiveContent,   // 检测敏感内容
  getAllSensitiveWords,    // 获取所有敏感词
  BODY_PARTS,              // 导出词库供测试使用
  SEXUAL_ACTS,
  ADULT_CONTENT,
  CLOTHING_STATE,
  CHINESE_BODY,
  CHINESE_SEXUAL,
  CHINESE_ADULT
};