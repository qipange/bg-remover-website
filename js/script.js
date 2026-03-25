// 图片背景去除工具 - 主脚本文件

// DOM 元素引用
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const originalPlaceholder = document.getElementById('originalPlaceholder');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const originalInfo = document.getElementById('originalInfo');
const resultInfo = document.getElementById('resultInfo');
const fileInfo = document.getElementById('fileInfo');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const formatOptions = document.querySelectorAll('input[name="format"]');

// 全局变量
let originalFile = null;
let processedBlob = null;
let isProcessing = false;

// 用户认证状态
let currentUser = null;
const AUTH_KEY = 'bg_remover_user';

// remove.bg API 密钥
const REMOVE_BG_API_KEY = 'QvqZp7MVBPi9AQ3wc51rnEba';

// Google OAuth 配置
const GOOGLE_CLIENT_ID = '248150719010-cfcv17vgabb3efj3m2pq9r723j4j9ect.apps.googleusercontent.com';
const REDIRECT_URI = 'https://bg-remover-9sv.pages.dev';

// PayPal 配置
const PAYPAL_CLIENT_ID = 'ATRfWZ_3wVGCBCpByqcXP1AIvN0amBbX0vgR8_2m0_jOyQ4y_q5ToL-xhjeTRiisBLtd84YHROvIRDeS';
const PAYPAL_SANDBOX = true;

// 显示加载状态
function showLoading(message = '正在处理图片...') {
    loadingMessage.textContent = message;
    loadingOverlay.classList.add('active');
    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
}

// 隐藏加载状态
function hideLoading() {
    loadingOverlay.classList.remove('active');
    isProcessing = false;
    updateProcessButton();
}

// 显示错误信息
function showError(message) {
    hideLoading();
    alert(`错误: ${message}`);
}

// 显示成功信息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
    
    // 添加 CSS 动画
    if (!document.getElementById('anim-style')) {
        const style = document.createElement('style');
        style.id = 'anim-style';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// 用户认证模块
// ============================================

// 初始化认证状态
function initAuth() {
    const savedUser = localStorage.getItem(AUTH_KEY);
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
            console.log('已恢复登录状态:', currentUser.email);
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
        }
    }
}

// 检查哈希中的 access_token (OAuth 回调)
function handleAuthCallback() {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            showLoading('正在验证登录...');
            
            // 获取用户信息
            fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
                .then(res => res.json())
                .then(userInfo => {
                    currentUser = {
                        id: userInfo.sub,
                        name: userInfo.name,
                        email: userInfo.email,
                        picture: userInfo.picture,
                        accessToken: accessToken,
                        loginTime: new Date().toISOString()
                    };
                    
                    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
                    updateAuthUI();
                    hideLoading();
                    showSuccess(`欢迎回来，${userInfo.name}！`);
                    
                    // 清除 URL hash
                    window.history.replaceState(null, '', window.location.pathname);
                })
                .catch(err => {
                    console.error('获取用户信息失败:', err);
                    hideLoading();
                    showError('登录验证失败，请重试');
                });
        }
    }
}

// Google 登录
function googleLogin() {
    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&prompt=select_account`;
    
    window.location.href = authUrl;
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem(AUTH_KEY);
    updateAuthUI();
    showSuccess('已退出登录');
}

// 更新认证 UI
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginOverlay = document.getElementById('loginOverlay');
    const mainContent = document.querySelector('main');
    
    if (currentUser) {
        // 已登录状态
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userAvatar.src = currentUser.picture;
        userName.textContent = currentUser.name;
        loginOverlay.classList.remove('active');
        mainContent.classList.remove('content-locked');
    } else {
        // 未登录状态
        loginBtn.style.display = 'flex';
        userInfo.style.display = 'none';
        mainContent.classList.add('content-locked');
    }
}

// ============================================
// PayPal 支付模块
// ============================================

// 打开支付弹窗
function openPricingModal() {
    const pricingOverlay = document.getElementById('pricingOverlay');
    if (pricingOverlay) {
        pricingOverlay.classList.add('active');
    }
}

// 关闭支付弹窗
function closePricingModal() {
    const pricingOverlay = document.getElementById('pricingOverlay');
    if (pricingOverlay) {
        pricingOverlay.classList.remove('active');
    }
}

// 初始化 PayPal 按钮
function initPayPalButtons() {
    if (typeof paypal === 'undefined') {
        console.log('PayPal SDK not loaded yet');
        return;
    }
    
    // 月度会员按钮
    try {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '4.99'
                        },
                        description: '月度会员'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showSuccess(`支付成功！欢迎 ${details.payer.name.given_name}`);
                    closePricingModal();
                    // TODO: 更新用户会员状态
                });
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                showError('支付失败，请重试');
            }
        }).render('#paypal-button-container-monthly');
    } catch (e) {
        console.error('Monthly button error:', e);
    }
    
    // 年度会员按钮
    try {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '29.99'
                        },
                        description: '年度会员'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showSuccess(`支付成功！欢迎 ${details.payer.name.given_name}`);
                    closePricingModal();
                    // TODO: 更新用户会员状态
                });
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                showError('支付失败，请重试');
            }
        }).render('#paypal-button-container-yearly');
    } catch (e) {
        console.error('Yearly button error:', e);
    }
}

// ============================================
// 原有功能模块
// ============================================

// 更新处理按钮状态
function updateProcessButton() {
    if (originalFile && !isProcessing) {
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 去除背景';
    } else if (isProcessing) {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    } else {
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> 去除背景';
    }
}

// 更新下载按钮状态
function updateDownloadButton() {
    downloadBtn.disabled = !processedBlob;
}

// 处理文件选择
function handleFileSelect(file) {
    if (!file) return;
    
    // 检查文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('请选择 PNG、JPG 或 WebP 格式的图片文件');
        return;
    }
    
    // 检查文件大小 (限制为 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('图片大小不能超过 10MB');
        return;
    }
    
    originalFile = file;
    
    // 显示文件信息
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.innerHTML = `
        <strong>${file.name}</strong><br>
        类型: ${file.type} | 大小: ${fileSize} MB
    `;
    fileInfo.classList.add('active');
    
    // 预览原图
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage.src = e.target.result;
        originalImage.style.display = 'block';
        originalPlaceholder.style.display = 'none';
        
        // 显示图片信息
        const img = new Image();
        img.onload = function() {
            originalInfo.textContent = `尺寸: ${img.width} × ${img.height} 像素`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // 重置结果区域
    resultImage.style.display = 'none';
    resultPlaceholder.style.display = 'flex';
    resultInfo.textContent = '';
    processedBlob = null;
    
    // 更新按钮状态
    updateProcessButton();
    updateDownloadButton();
}

// 使用 imgly 库去除背景
async function processWithImgly(imageFile) {
    showLoading('正在加载 AI 模型...');
    
    try {
        // 检查 imgly 库是否可用
        if (typeof removeBackground === 'function') {
            const blob = await removeBackground(imageFile, {
                progress: (key, current, total) => {
                    const percent = Math.round((current / total) * 100);
                    loadingMessage.textContent = `正在处理... ${percent}%`;
                }
            });
            return blob;
        } else {
            throw new Error('AI 库未加载');
        }
    } catch (error) {
        console.error('Imgly 处理失败:', error);
        throw error;
    }
}

// 使用 remove.bg API（需要 API 密钥）
async function processWithRemoveBgAPI(imageFile) {
    showLoading('正在调用 remove.bg API...');
    
    const formData = new FormData();
    formData.append('image_file', imageFile);
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': REMOVE_BG_API_KEY
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('API 调用失败');
    }
    
    return await response.blob();
}

// 使用 Canvas 的简单背景去除（备用方案）
function processWithCanvas(imageFile) {
    return new Promise((resolve, reject) => {
        showLoading('正在处理图片...');
        
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 限制图片尺寸
                const maxSize = 1024;
                let width = img.width;
                let height = img.height;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制原图
                ctx.drawImage(img, 0, 0, width, height);
                
                // 获取图像数据
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                // 简单的背景检测（基于颜色）
                // 获取四个角落的颜色作为背景参考
                const corners = [
                    { x: 0, y: 0 },
                    { x: width - 1, y: 0 },
                    { x: 0, y: height - 1 },
                    { x: width - 1, y: height - 1 }
                ];
                
                let bgR = 0, bgG = 0, bgB = 0;
                corners.forEach(corner => {
                    const idx = (corner.y * width + corner.x) * 4;
                    bgR += data[idx];
                    bgG += data[idx + 1];
                    bgB += data[idx + 2];
                });
                bgR = Math.floor(bgR / 4);
                bgG = Math.floor(bgG / 4);
                bgB = Math.floor(bgB / 4);
                
                // 阈值来判断背景
                const threshold = 50;
                
                // 遍历所有像素
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // 计算与背景颜色的差异
                    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                    
                    if (diff < threshold) {
                        // 背景像素设为完全透明
                        data[i + 3] = 0;
                    } else if (diff < threshold * 2) {
                        // 边缘区域逐渐透明
                        const alpha = Math.min(255, (diff - threshold) * 8);
                        data[i + 3] = alpha;
                    }
                }
                
                // 将处理后的数据放回 canvas
                ctx.putImageData(imageData, 0, 0);
                
                // 转换为 blob
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = URL.createObjectURL(imageFile);
    });
}

// 处理图片背景去除
async function processImage() {
    if (!originalFile || isProcessing) {
        console.log('无法处理：缺少文件或正在处理中');
        return;
    }
    
    showLoading('正在初始化...');
    
    try {
        let blob;
        
        // 优先使用 remove.bg API
        if (REMOVE_BG_API_KEY && REMOVE_BG_API_KEY.length > 0) {
            try {
                blob = await processWithRemoveBgAPI(originalFile);
            } catch (e) {
                console.warn('remove.bg API 失败:', e);
                // 备用：尝试 imgly
                if (typeof removeBackground === 'function') {
                    blob = await processWithImgly(originalFile);
                } else {
                    blob = await processWithCanvas(originalFile);
                }
            }
        } else if (typeof removeBackground === 'function') {
            // 备用：使用 imgly 库
            try {
                blob = await processWithImgly(originalFile);
            } catch (e) {
                console.warn('Imgly 失败，尝试备用方案:', e);
                blob = await processWithCanvas(originalFile);
            }
        } else {
            // 最后使用 Canvas 方案
            blob = await processWithCanvas(originalFile);
        }
        
        // 保存处理结果
        processedBlob = blob;
        
        // 显示处理后的图片
        const resultUrl = URL.createObjectURL(blob);
        resultImage.src = resultUrl;
        resultImage.style.display = 'block';
        resultPlaceholder.style.display = 'none';
        
        // 获取图片尺寸
        const img = new Image();
        img.onload = function() {
            resultInfo.textContent = `已去除背景 | 尺寸: ${img.width} × ${img.height} 像素`;
        };
        img.src = resultUrl;
        
        hideLoading();
        showSuccess('背景去除成功！');
        updateDownloadButton();
        
    } catch (error) {
        console.error('图片处理失败:', error);
        showError(`处理失败: ${error.message}`);
        hideLoading();
    }
}

// 下载处理后的图片
function downloadProcessedImage() {
    if (!processedBlob) return;
    
    const format = document.querySelector('input[name="format"]:checked').value;
    let mimeType, extension;
    
    switch (format) {
        case 'jpg':
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'webp':
            mimeType = 'image/webp';
            extension = 'webp';
            break;
        default:
            mimeType = 'image/png';
            extension = 'png';
    }
    
    // 如果选择的是非 PNG 格式，需要转换
    if (format !== 'png') {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `background-removed.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showSuccess('图片下载开始！');
            }, mimeType);
        };
        img.src = URL.createObjectURL(processedBlob);
    } else {
        // 直接下载 PNG
        const url = URL.createObjectURL(processedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `background-removed.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('图片下载开始！');
    }
}

// 重置所有内容
function resetAll() {
    originalFile = null;
    processedBlob = null;
    
    // 重置文件输入
    fileInput.value = '';
    
    // 隐藏文件信息
    fileInfo.classList.remove('active');
    fileInfo.innerHTML = '';
    
    // 重置图片显示
    originalImage.style.display = 'none';
    originalPlaceholder.style.display = 'flex';
    originalInfo.textContent = '';
    
    resultImage.style.display = 'none';
    resultPlaceholder.style.display = 'flex';
    resultInfo.textContent = '';
    
    // 重置按钮状态
    updateProcessButton();
    updateDownloadButton();
}

// 事件监听器
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// 拖放功能
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

processBtn.addEventListener('click', processImage);
resetBtn.addEventListener('click', resetAll);
downloadBtn.addEventListener('click', downloadProcessedImage);

// 格式选项变化监听
formatOptions.forEach(option => {
    option.addEventListener('change', () => {
        if (processedBlob) {
            showSuccess(`已切换为 ${option.value.toUpperCase()} 格式`);
        }
    });
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Background Remover Tool initialized');
    console.log('removeBackground available:', typeof removeBackground === 'function');
    
    // 初始化认证
    initAuth();
    handleAuthCallback();
    
    // 登录按钮事件
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const closePricingBtn = document.getElementById('closePricing');
    const pricingOverlay = document.getElementById('pricingOverlay');
    
    if (loginBtn) loginBtn.addEventListener('click', googleLogin);
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', googleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (closePricingBtn) closePricingBtn.addEventListener('click', closePricingModal);
    if (pricingOverlay) pricingOverlay.addEventListener('click', (e) => {
        if (e.target === pricingOverlay) closePricingModal();
    });
    
    // 初始化 PayPal 按钮（延迟等待 SDK 加载）
    setTimeout(initPayPalButtons, 1000);
    
    updateProcessButton();
    updateDownloadButton();
});

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl + O 打开文件
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        fileInput.click();
    }
    
    // Ctrl + P 处理图片
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (!processBtn.disabled) {
            processImage();
        }
    }
    
    // Ctrl + D 下载图片
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (!downloadBtn.disabled) {
            downloadProcessedImage();
        }
    }
    
    // Escape 键重置
    if (e.key === 'Escape') {
        resetAll();
    }
});

// 添加服务工作者（如果支持）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker 注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker 注册失败:', error);
            });
    });
}