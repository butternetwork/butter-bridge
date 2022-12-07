import * as UAuthWeb3Modal from "@uauth/web3modal";
import UAuthSPA from "@uauth/js";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import Web3 from "web3";
import Decimal from "decimal.js";
import store from "@/store/index";
import Vue from "vue";

class Connector {
    constructor() {
        this.web3 = null;
        this.provider = null;
        this.web3modal = null;
        this.initWeb3Modal();
    }

    initWeb3Modal() {

        const uauthOptions = {
            clientID: "4b5a89d2-9384-41be-824e-8d0bce9f8867",//测试 e22e8fc1-04da-4ecc-89de-c446854294d2
            redirectUri: "https://test-bridge.butternetwork.io",//http://localhost:8080
            scope: "openid wallet"
        };
        // const uauthOptions = {
        //     clientID: "e22e8fc1-04da-4ecc-89de-c446854294d2",//测试 e22e8fc1-04da-4ecc-89de-c446854294d2
        //     redirectUri: "http://localhost:8080/",//http://localhost:8080
        //     scope: "openid wallet"
        // };

        const providerOptions = {
            cacheProvider: true,
            // prefix.
            'custom-uauth': {
                // The UI Assets
                display: UAuthWeb3Modal.display,

                // The Connector
                connector: UAuthWeb3Modal.connector,

                // The SPA libary
                package: UAuthSPA,

                // The SPA libary options
                options: uauthOptions,
            },

            // For full functionality we include the walletconnect provider as well.
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: 'c16539ab6e244057b498657341375a3d',
                },
            },
        }

        const web3modal = new Web3Modal({
            cacheProvider: true,
            providerOptions,
        });
        UAuthWeb3Modal.registerWeb3Modal(web3modal);
        this.web3modal = web3modal;
    }

    async connect() {

        const uauthOptions = {
            clientID: "4b5a89d2-9384-41be-824e-8d0bce9f8867",//测试 e22e8fc1-04da-4ecc-89de-c446854294d2
            redirectUri: "https://test-bridge.butternetwork.io",//http://localhost:8080
            scope: "openid wallet"
        };

        // const uauthOptions = {
        //     clientID: "e22e8fc1-04da-4ecc-89de-c446854294d2",//测试 e22e8fc1-04da-4ecc-89de-c446854294d2
        //     redirectUri: "http://localhost:8080/",//http://localhost:8080
        //     scope: "openid wallet"
        // };

        try {
            this.provider = await this.web3modal.connect();
            console.log('this.web3modal',this.web3modal.providerController.cachedProvider)
            const web3 = new Web3(this.provider);
            console.log('this.provider',this.provider)
            const info = await Promise.all([web3.eth.getAccounts(), web3.eth.getChainId()]);
            Vue.prototype.$web3 = web3;
            Vue.prototype.$client = () => {
                return web3;
            };
            Vue.prototype.$provider = this.provider;
            this.accountChanged(info[0]);
            this.chainChanged(info[1]);
            this.addListener();
            if (this.web3modal.providerController.cachedProvider==='custom-uauth') {
                let user = await new UAuthSPA(uauthOptions).user()
                localStorage.setItem('userDomain',user.sub)
                return {
                    account: user.sub.toString(),
                    chainId: info[1],
                };
            }else {
                localStorage.removeItem('userDomain')
                return {
                    account: info[0][0],
                    chainId: info[1],
                };
            }
            // return {
            //     account: info[0][0],
            //     chainId: info[1],
            // };
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    addListener() {
        this.provider.on("accountsChanged", this.accountChanged);

        this.provider.on("chainChanged", this.chainChanged);

        this.provider.on("disconnect", () => {
            this.web3modal.clearCachedProvider();
            store.commit('logout');
        });
    }

    chainChanged(chainId) {
        const id = new Decimal(chainId).toHex();
        store.commit('setChainId', id);
    }

    accountChanged(accounts) {
        if (typeof accounts === 'string') {
            console.log('accounts',accounts)
            store.commit('setAddress', accounts);
        } else {
            store.commit('setAddress', accounts[0]);
        }
    }
}

const connector = new Connector();

export default connector;
