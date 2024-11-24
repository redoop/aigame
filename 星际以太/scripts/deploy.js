async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("部署合约的账户:", deployer.address);

    const SpaceGame = await ethers.getContractFactory("SpaceGame");
    const spaceGame = await SpaceGame.deploy();
    await spaceGame.deployed();

    console.log("SpaceGame合约部署地址:", spaceGame.address);
    
    // 将ABI和地址保存到前端可以访问的文件中
    const fs = require("fs");
    const contractInfo = {
        address: spaceGame.address,
        abi: JSON.parse(spaceGame.interface.format('json'))
    };

    fs.writeFileSync(
        "./src/contractInfo.json",
        JSON.stringify(contractInfo, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 