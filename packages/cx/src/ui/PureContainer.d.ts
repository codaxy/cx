import { Container, ContainerConfig } from "./Container";

export interface PureContainerProps extends ContainerConfig {}

export class PureContainer<T extends PureContainerProps> extends Container<T> {}
