declare module "react-markdown/lib/ast-to-react" {
    import type { ReactNode, HTMLAttributes, ClassAttributes } from "react";
    export type CodeProps = ClassAttributes<HTMLElement> &
        HTMLAttributes<HTMLElement> & {
            inline?: boolean;
            children?: ReactNode;
        };
}