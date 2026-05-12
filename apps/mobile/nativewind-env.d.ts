/// <reference types="nativewind/types" />

// CSS 파일을 모듈로 인식하게 해줍니다.
declare module "*.css" {
  const content: any;
  export default content;
}