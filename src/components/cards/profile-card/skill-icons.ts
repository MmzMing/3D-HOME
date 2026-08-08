import type { IconType } from 'react-icons';
import { Sparkles } from 'lucide-react';
import { FaClock, FaDatabase, FaJava, FaRocket } from 'react-icons/fa6';
import {
  SiAlibabacloud,
  SiApachekafka,
  SiDocker,
  SiElasticsearch,
  SiFastapi,
  SiGrafana,
  SiJenkins,
  SiKubernetes,
  SiMinio,
  SiMongodb,
  SiMysql,
  SiPostgresql,
  SiPrometheus,
  SiPython,
  SiRabbitmq,
  SiReact,
  SiRedis,
  SiSqlalchemy,
  SiSpring,
  SiVuedotjs,
} from 'react-icons/si';

const skillIcons: Record<string, IconType | typeof Sparkles> = {
  docker: SiDocker,
  elasticsearch: SiElasticsearch,
  fastapi: SiFastapi,
  grafana: SiGrafana,
  java: FaJava,
  jenkins: SiJenkins,
  kafka: SiApachekafka,
  kubernetes: SiKubernetes,
  minio: SiMinio,
  mongodb: SiMongodb,
  mysql: SiMysql,
  oracle: FaDatabase,
  oss: SiAlibabacloud,
  plsql: FaDatabase,
  postgresql: SiPostgresql,
  prometheus: SiPrometheus,
  python: SiPython,
  rabbitmq: SiRabbitmq,
  react: SiReact,
  redis: SiRedis,
  rocketmq: FaRocket,
  spring: SiSpring,
  'spring-cloud': SiSpring,
  sqlalchemy: SiSqlalchemy,
  'vibe-coding': Sparkles,
  vue: SiVuedotjs,
  'xxl-job': FaClock,
};

export function resolveSkillIcon(icon: string) {
  return skillIcons[icon];
}
