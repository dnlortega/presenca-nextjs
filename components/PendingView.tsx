"use client";
import { useSession, signOut } from "next-auth/react";
import { LucideShieldAlert, LucideLogOut } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PendingView() {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 page-transition relative overflow-hidden">
            {/* Background Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

            <Card className="max-w-md w-full border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardContent className="pt-10 pb-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto ring-8 ring-orange-500/5">
                        <LucideShieldAlert className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-black tracking-tight uppercase">Acesso <span className="text-orange-500">Pendente</span></h1>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                            Olá, <span className="text-primary font-bold">{session?.user?.email}</span>!<br />
                            Seu acesso ao sistema <span className="font-black uppercase tracking-tighter">Presença.Pro</span> ainda não foi liberado pelo administrador.
                        </p>
                    </div>

                    <div className="bg-muted/50 border border-border rounded-2xl p-4 text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                        Assim que seu perfil for aprovado, você poderá acessar as ferramentas de registro e gestão.
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:bg-destructive/5 hover:text-destructive transition-all"
                    >
                        <LucideLogOut className="w-4 h-4" />
                        Sair do Sistema
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
