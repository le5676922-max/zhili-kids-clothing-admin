/**
 * 阿里云 OSS 客户端直传工具
 * 使用流程：
 * 1. 前端请求后端获取上传签名
 * 2. 前端直接上传文件到 OSS
 * 3. 返回上传后的 URL
 */

const OssUploader = {
    /**
     * 获取上传签名
     * @param {string} type - 上传类型：'avatar' 或 'license'
     * @param {string} fileName - 文件名（可选，用于获取扩展名）
     * @returns {Promise}
     */
    async getSignature(type, fileName) {
        // file:// 下 hostname 为空；用本地服务器打开时取当前 host，否则用 localhost
        const API_BASE = window.ZhiliApi.apiOssRoot();

        const url = type === 'avatar' 
            ? API_BASE + '/avatar-signature' 
            : API_BASE + '/license-signature';
        
        let response;
        try {
            response = await fetch(url + (fileName ? '?fileName=' + encodeURIComponent(fileName) : ''));
        } catch (e) {
            if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
                throw new Error('无法连接后端：请确认 1) Java 后端已启动（端口 8080） 2) 若用「打开文件」方式打开页面，请改用本地服务器（如 VS Code Live Server）打开');
            }
            throw e;
        }
        const data = await response.json();

        if (data.code !== 200 && data.code !== 0) {
            throw new Error(data.message || '获取上传签名失败');
        }

        return data.data;
    },

    /**
     * 上传文件到 OSS
     * @param {File} file - 要上传的文件对象
     * @param {Object} signatureData - 签名数据（从后端获取）
     * @returns {Promise<string>} - 上传后的 URL
     */
    async upload(file, signatureData) {
        const { key, policy, signature, accessKeyId, host, bucket } = signatureData;

        const formData = new FormData();
        // OSS 表单上传字段名必须与 policy 中的一致
        formData.append('key', key);
        formData.append('policy', policy);
        formData.append('OSSAccessKeyId', accessKeyId);
        formData.append('success_action_status', '200');
        formData.append('signature', signature);
        formData.append('x-oss-object-acl', 'public-read');
        formData.append('file', file);

        let response;
        try {
            response = await fetch(host, {
                method: 'POST',
                body: formData,
            });
        } catch (e) {
            if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
                throw new Error('OSS_UPLOAD_FAILED'); // 由上层判断并尝试经后端上传
            }
            throw e;
        }

        // OSS 返回 200 或 204 都表示成功
        if (!response.ok && response.status !== 204) {
            throw new Error('上传到存储失败，OSS 返回错误: ' + response.status);
        }

        return host + '/' + key;
    },

    /**
     * 经后端上传头像（当 OSS 直传失败时的备用方案）
     * @param {File} file - 文件
     * @param {string} token - 登录 token
     * @returns {Promise<string>} - 头像 URL
     */
    async uploadAvatarViaBackend(file, token) {
        const url = window.ZhiliApi.apiUpload() + '/avatar';

        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        const data = await response.json();
        if (data.code !== 200 && data.code !== 0) {
            throw new Error(data.message || '服务器上传失败');
        }
        return data.data && data.data.url ? data.data.url : '';
    },

    /**
     * 完整的上传流程：获取签名 + 上传
     * @param {File} file - 要上传的文件
     * @param {string} type - 上传类型：'avatar' 或 'license'
     * @returns {Promise<string>} - 上传后的 URL
     */
    async uploadFile(file, type) {
        // 验证文件类型
        if (type === 'avatar') {
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
                throw new Error('请选择 JPG、PNG、GIF 或 WebP 图片');
            }
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('图片不能超过 2MB');
            }
        } else if (type === 'license') {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('请选择 JPG、PNG、GIF、WebP 或 PDF 文件');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('文件不能超过 5MB');
            }
        }
        
        // 获取签名
        const signatureData = await this.getSignature(type, file.name);

        // 上传到 OSS
        const url = await this.upload(file, signatureData);

        return url;
    },

    /**
     * 上传头像（优先 OSS 直传，失败则经后端上传）
     */
    async uploadAvatarWithFallback(file, token) {
        try {
            return await this.uploadFile(file, 'avatar');
        } catch (err) {
            if (err.message === 'OSS_UPLOAD_FAILED' && token) {
                return await this.uploadAvatarViaBackend(file, token);
            }
            throw err;
        }
    },

    /**
     * 经后端上传营业执照（存入 bucket yingyezhizhao-zhili-kids-system，与 OSS 直传策略一致）
     * 当 OSS 直传失败时使用，无需登录
     */
    async uploadLicenseViaBackend(file) {
        const url = window.ZhiliApi.apiUpload() + '/license';

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.code !== 200 && data.code !== 0) {
            throw new Error(data.message || '营业执照上传失败');
        }
        return data.data && data.data.url ? data.data.url : '';
    },

    /**
     * 上传营业执照（优先 OSS 直传到 yingyezhizhao-zhili-kids-system，失败则经后端上传）
     */
    async uploadLicenseWithFallback(file) {
        try {
            return await this.uploadFile(file, 'license');
        } catch (err) {
            if (err.message === 'OSS_UPLOAD_FAILED') {
                return await this.uploadLicenseViaBackend(file);
            }
            throw err;
        }
    }
};

// 导出到全局
window.OssUploader = OssUploader;
