import type { IconType } from 'react-icons';
import { FaDatabase } from 'react-icons/fa6';
import {
  SiApachemaven,
  SiApacherocketmq,
  SiCss,
  SiDocker,
  SiElasticsearch,
  SiHtml5,
  SiJenkins,
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiNodedotjs,
  SiOpenjdk,
  SiReact,
  SiRedis,
  SiSpring,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
} from 'react-icons/si';

const skillIcons: Record<string, IconType> = {
  css: SiCss,
  docker: SiDocker,
  elasticsearch: SiElasticsearch,
  html: SiHtml5,
  java: SiOpenjdk,
  javascript: SiJavascript,
  jenkins: SiJenkins,
  maven: SiApachemaven,
  mongodb: SiMongodb,
  mysql: SiMysql,
  node: SiNodedotjs,
  oracle: FaDatabase,
  react: SiReact,
  redis: SiRedis,
  rocketmq: SiApacherocketmq,
  spring: SiSpring,
  'spring-cloud': SiSpring,
  tailwind: SiTailwindcss,
  typescript: SiTypescript,
  vue: SiVuedotjs,
};

export function resolveSkillIcon(icon: string) {
  return skillIcons[icon];
}
