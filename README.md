# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will
remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right
into your project so you have full control over them. All of the commands except `eject` will still work, but they will
point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you
shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t
customize it when you are ready for it.

## Learn More

You can learn more in
the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## 下载完本工程后

1. 复制到本地后，先删除工程下的`.git`文件夹
2. 编辑`package.json`文件，修改工程名`name`属性，再退出编辑软件，修改工程所在的文件夹名
3. 进入工程目录，执行`yarn`命令来下载依赖
4. 内容脚本放在`src/content`下，后台脚本放在`src/background`下，并在`service_worker.ts`中通过`importScripts`导入其它后台脚本以调用
5. 添加了新脚本后，注意要在`craco.config.js`的`entry`中添加以打包到build文件夹，以及在`/public/manifest.json`中设置build文件夹下脚本的路径
6. 因为`react`默认为单页面，改为多页面比较麻烦，所以仅使用单页面。选项页在`src/pages/options`目录下，弹窗页在`src/pages/popup`目录下，在`manifest.json`中以`hash`
   作为标识。可在`src/pages/`目录下创建更多页面，然后在`attentions.tsx`中添加路由入口
7. 打开`build/index.html`，仅保留`main.js`脚本的引用，其它脚本的引用全部删除（麻烦，但还没有找到自动化的方法）
