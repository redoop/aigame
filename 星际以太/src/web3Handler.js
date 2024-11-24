class Web3Handler {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.setupEventListeners();
        console.log('Web3Handler initialized');
    }

    setupEventListeners() {
        const connectButton = document.getElementById('connect-wallet');
        if (connectButton) {
            connectButton.addEventListener('click', async () => {
                console.log('Connect button clicked');
                await this.connect();
            });
        } else {
            console.error('Connect button not found');
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                this.handleAccountsChanged(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed:', chainId);
                window.location.reload();
            });
        }
    }

    async connect() {
        console.log('Attempting to connect...');
        if (typeof window.ethereum !== 'undefined') {
            try {
                console.log('MetaMask found, requesting accounts...');
                this.web3 = new Web3(window.ethereum);
                
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                console.log('Accounts received:', accounts);
                this.account = accounts[0];
                
                // 更新UI
                this.updateUIOnConnect();
                
                // 初始化合约
                await this.initContract();
                
                return true;
            } catch (error) {
                console.error('Connection error:', error);
                alert('连接失败: ' + error.message);
                return false;
            }
        } else {
            console.error('MetaMask not found');
            alert('请安装MetaMask!');
            return false;
        }
    }

    updateUIOnConnect() {
        const connectButton = document.getElementById('connect-wallet');
        const walletAddress = document.getElementById('wallet-address');
        
        if (connectButton && walletAddress) {
            connectButton.innerHTML = `
                <img src="./images/metamask.svg" alt="MetaMask">
                已连接
            `;
            connectButton.style.background = '#4CAF50';
            walletAddress.textContent = this.account.slice(0, 6) + '...' + this.account.slice(-4);
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.account = null;
            const connectButton = document.getElementById('connect-wallet');
            if (connectButton) {
                connectButton.innerHTML = `
                    <img src="./images/metamask.svg" alt="MetaMask">
                    连接钱包
                `;
                connectButton.style.background = '#FF9C27';
            }
            document.getElementById('wallet-address').textContent = '未连接';
        } else {
            this.account = accounts[0];
            document.getElementById('wallet-address').textContent = 
                this.account.slice(0, 6) + '...' + this.account.slice(-4);
        }
    }

    async initContract() {
        try {
            const response = await fetch('./src/contractInfo.json');
            if (!response.ok) {
                throw new Error('Contract info not found');
            }
            const contractInfo = await response.json();
            this.contract = new this.web3.eth.Contract(
                contractInfo.abi,
                contractInfo.address
            );
            console.log('Contract initialized:', this.contract);
        } catch (error) {
            console.error('Contract initialization error:', error);
            alert('合约初始化失败，请确保已部署合约');
        }
    }

    async createShip(name) {
        try {
            await this.contract.methods.createShip(name).send({
                from: this.account
            });
        } catch (error) {
            console.error('创建飞船失败:', error);
        }
    }

    async mineResources() {
        try {
            await this.contract.methods.mineResources().send({
                from: this.account
            });
        } catch (error) {
            console.error('挖矿失败:', error);
        }
    }
} 